// Copyright (c) opensource-china Corporation
// All rights reserved. 
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and 
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 

package com.opensource-china.frameworklauncher.applicationmaster;

import com.opensource-china.frameworklauncher.common.GlobalConstants;
import com.opensource-china.frameworklauncher.common.exceptions.AggregateException;
import com.opensource-china.frameworklauncher.common.log.DefaultLogger;
import com.opensource-china.frameworklauncher.common.model.*;
import com.opensource-china.frameworklauncher.common.service.StopStatus;
import com.opensource-china.frameworklauncher.common.utils.DnsUtils;
import com.opensource-china.frameworklauncher.hdfsstore.HdfsStore;
import com.opensource-china.frameworklauncher.hdfsstore.MockHdfsStore;
import com.opensource-china.frameworklauncher.testutils.FeatureTestUtils;
import com.opensource-china.frameworklauncher.zookeeperstore.MockZookeeperStore;
import com.opensource-china.frameworklauncher.zookeeperstore.ZookeeperStore;
import org.apache.hadoop.yarn.api.records.ContainerId;
import org.apache.hadoop.yarn.api.records.Resource;
import org.junit.Assert;
import org.junit.Test;

import java.io.File;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class GangAllocationTest {
  private static final DefaultLogger LOG = new DefaultLogger(GangAllocationTest.class);

  private final String frameworkName = "TestGangAllocation";
  private String taskRoleName;
  private int taskNum;

  private MockResourceManager mockResourceManager;
  private ZookeeperStore zkStore;
  private HdfsStore hdfsStore;

  private int exitCode;

  @Test
  public void testGangAllocation() throws Exception {
    init();

    CountDownLatch signal = new CountDownLatch(1);
    ApplicationMaster am = new AMForTest(signal);
    Thread amThread = new Thread(() -> {
      try {
        am.start();
      } catch (Exception e) {
        am.handleException(e);
      }
    });

    amThread.start();
    amThread.join();

    AggregatedTaskRoleStatus aggregatedTaskRoleStatus =
        zkStore.getAggregatedTaskRoleStatus(frameworkName, taskRoleName);
    List<TaskStatus> taskStatusArray = aggregatedTaskRoleStatus.getTaskStatuses().getTaskStatusArray();

    int completedTaskNum = 0;
    for (TaskStatus taskStatus : taskStatusArray) {
      if (taskStatus.getContainerExitCode() != null) {
        Assert.assertTrue(taskStatus.getTaskState() == TaskState.TASK_COMPLETED);
        completedTaskNum++;
      } else {
        Assert.assertTrue(taskStatus.getTaskState() != TaskState.TASK_COMPLETED);
      }
    }
    Assert.assertTrue(completedTaskNum != 0);

    Assert.assertTrue("ApplicationMaster didn't stop",
        signal.getCount() == 0);
    Assert.assertTrue(String.format("Wrong exitCode: %s", exitCode),
        exitCode == GlobalConstants.EXIT_CODE_LAUNCHER_TRANSIENT_FAILED);
  }

  private void init() throws Exception {
    String frameworkFile = Thread.currentThread().getContextClassLoader()
        .getResource("TestGangAllocation.json").getPath();
    FrameworkRequest frameworkRequest = FeatureTestUtils
        .getFrameworkRequestFromJson(frameworkName, frameworkFile,
            DnsUtils.getLocalHost(), "user");
    FrameworkStatus frameworkStatus = FeatureTestUtils.getFrameworkStatusFromRequest(frameworkRequest);

    Map<String, TaskRoleDescriptor> taskRoleDescriptorMap =
        frameworkRequest.getFrameworkDescriptor().getTaskRoles();
    for (Map.Entry<String, TaskRoleDescriptor> entry : taskRoleDescriptorMap.entrySet()) {
      taskRoleName = entry.getKey();

      TaskRoleDescriptor taskRoleDescriptor = entry.getValue();
      taskNum = taskRoleDescriptor.getTaskNumber();

      List<String> sourceLocations = taskRoleDescriptor.getTaskService().getSourceLocations();
      String sourceLocation = FeatureTestUtils.HDFS_BASE_DIR + "/" + getClass().getSimpleName();
      new File(sourceLocation).mkdir();
      sourceLocations.add(sourceLocation);
    }

    FeatureTestUtils.setEnvsVariables(frameworkName, frameworkStatus);

    // Initialize zookeeper
    zkStore = MockZookeeperStore.newInstanceWithClean(FeatureTestUtils.ZK_BASE_DIR);
    FeatureTestUtils.initZK(zkStore, frameworkRequest, frameworkStatus);

    hdfsStore = new MockHdfsStore(FeatureTestUtils.HDFS_BASE_DIR);

    mockResourceManager = MockResourceManager.newInstance(taskNum,
        Resource.newInstance(4, 4));
  }


  private class AMForTest extends MockApplicationMaster {
    private final DefaultLogger LOGGER = new DefaultLogger(AMForTest.class);
    private final CountDownLatch signal;

    public AMForTest(CountDownLatch signal) {
      this.signal = signal;
    }

    @Override
    protected void initialize() throws Exception {
      super.initialize();

      rmClient = new MockAMRMClient<>(FeatureTestUtils.newApplicationAttemptId(),
          mockResourceManager, 60 * 1000,
          new RMClientCallbackHandler(this));

      yarnClient = new MockYarnClient(mockResourceManager);
    }

    @Override
    protected void run() throws Exception {
      super.run();
      sendErrorMessage();

      signal.await(20, TimeUnit.SECONDS);
    }

    @Override
    public synchronized void stop(StopStatus stopStatus) {
      // Best Effort to stop Gracefully
      AggregateException ae = new AggregateException();

      try {
        if (statusManager != null) {
          statusManager.stop(stopStatus);
        }
      } catch (Exception e) {
        ae.addException(e);
      }

      try {
        if (requestManager != null) {
          requestManager.stop(stopStatus);
        }
      } catch (Exception e) {
        ae.addException(e);
      }

      if (ae.getExceptions().size() > 0) {
        LOGGER.logWarning(ae, "Failed to stop %s gracefully", serviceName);
      }

      LOGGER.logInfo("%s stopped", serviceName);
      exitCode = stopStatus.getCode();
      signal.countDown();
    }

    private void sendErrorMessage() throws InterruptedException {
      List<TaskState> stateList = Arrays.asList(
          TaskState.CONTAINER_ALLOCATED, TaskState.CONTAINER_LAUNCHED, TaskState.CONTAINER_RUNNING);
      List<TaskStatus> list = statusManager.getTaskStatus(new HashSet<>(stateList));
      while (list.size() < taskNum) {
        Thread.sleep(2000);
        list = statusManager.getTaskStatus(new HashSet<>(stateList));
      }

      String containerIdStr = list.get(0).getContainerId();
      ContainerId containerId = ContainerId.fromString(containerIdStr);
      onStartContainerError(containerId, new Exception());
    }
  }
}