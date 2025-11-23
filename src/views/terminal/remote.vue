/** Copyright 2020 Tianshu AI Platform. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================
 */

<template>
  <div id="pro-remote-wrapper" class="app-container">
    <div class="ts-tip my-20">
      说明：
      <ol>
        <li>
          远程连接进入环境后，在点击保存并停止之前，只有在 /workspace 下的文件才会被永久保存。
        </li>
        <li>
          保存并停止会将当前环境打包成镜像，需要等待一段时间，此时应尽量避免在远程连接窗口输入命令。
        </li>
        <li>
          如果挂载预置数据集，预置数据集会以只读模式挂载到 /dataset 下。
        </li>
        <li>
          “停止并保存”功能只保存连接中的 master 节点的环境和数据。
        </li>
      </ol>
    </div>
    <el-button type="primary" @click="createConnection">新建连接</el-button>
    <el-card
      v-for="connection of connectionList"
      :id="connection.name"
      :key="connection.id"
      class="my-20"
    >
      <template #header>
        <span>{{ connection.name }}</span>
        <span class="fr">节点数：{{ connection.totalNode }}</span>
      </template>
      <div class="info-row">
        <span class="info-title">挂载预置数据集：</span>
        <span class="info-value">{{ connection.dataSourceName || '无' }}</span>
      </div>
      <div class="info-row">
        <span class="info-title">启动镜像：</span>
        <span class="info-value">{{ connection.imageName }}:{{ connection.imageTag }}</span>
      </div>
      <div class="info-row">
        <span class="info-title">状态</span>
        <span class="info-value"
          ><el-tag :type="terminalTagMap[connection.status]" effect="plain" class="v-text-bottom">{{
            terminalNameMap[connection.status] || '--'
          }}</el-tag>
          <MsgPopover
            v-if="hasStatusDetail(connection.statusDetail)"
            :status-detail="connection.statusDetail"
          />
        </span>
      </div>
      <div class="info-row">
        环境已启动，您可以通过以下命令远程连接进入环境开发：
      </div>
      <BaseTable
        :highlight-current-row="false"
        :columns="connectionNodeTableColumns"
        :data="connection.info"
      >
        <template #id="scope">
          <span>{{ scope.row.id }}</span>
          <el-tag v-if="scope.row.masterFlag" effect="plain">master</el-tag>
        </template>
        <template #status="scope">
          <el-tag :type="terminalInfoTagMap[scope.row.status]" effect="plain">{{
            terminalInfoNameMap[scope.row.status] || '未知'
          }}</el-tag>
          <MsgPopover
            v-if="hasStatusDetail(scope.row.statusDetail)"
            :status-detail="scope.row.statusDetail"
          />
        </template>
      </BaseTable>
      <div class="connection-footer fr my-20">
        <el-button
          v-show="canSave(connection)"
          type="primary"
          @click="prereserveConnection(connection)"
          >保存并停止</el-button
        >
        <el-button
          v-show="canRestart(connection)"
          type="primary"
          @click="restartConnection(connection)"
          >重新启动</el-button
        >
        <el-button type="danger" @click="deleteConnection(connection)">删除</el-button>
      </div>
    </el-card>
    <div v-if="connectionList.length === 0" class="empty-connection-wrapper">
      <el-divider />
      暂无连接
      <el-divider />
    </div>
    <BaseModal
      :visible.sync="formVisible"
      :title="formTitle"
      width="800px"
      :loading="formLoading"
      @cancel="formVisible = false"
      @ok="onFormSubmit"
      @close="onFormClose"
    >
      <ConnectionForm ref="formRef" />
    </BaseModal>
    <BaseModal
      :visible.sync="preserveFormVisible"
      title="保存并停止"
      width="800px"
      :loading="preserveFormLoading"
      @cancel="preserveFormVisible = false"
      @ok="onPreserveFormSubmit"
      @close="onPreserveFormClose"
    >
      <PreserveForm ref="preserveFormRef" />
    </BaseModal>
  </div>
</template>

<script>
import { computed, nextTick, reactive, ref, toRefs, onUnmounted } from '@vue/composition-api';
import { Message, MessageBox } from 'element-ui';

import BaseTable from '@/components/BaseTable';
import BaseModal from '@/components/BaseModal';
import MsgPopover from '@/components/MsgPopover';
import { createTerminal, deleteTerminal, restartTerminal, preserveTerminal } from '@/api/terminal';
import { generateMap, moveToAnchor, emitter } from '@/utils';

import {
  connectionNodeTableColumns,
  useGetTerminals,
  TERMINAL_STATUS_ENUM,
  TERMINAL_STATUS_MAP,
  TERMINAL_INFO_STATUS_ENUM,
  TERMINAL_INFO_STATUS_MAP,
  usePoll,
} from './utils';
import ConnectionForm from './components/connectionForm';
import PreserveForm from './components/preserveForm';

// 新建连接/重启连接表单
const useConnectionForm = ({ getTerminals, jumpToAnchor }) => {
  const state = reactive({
    formVisible: false,
    formLoading: false,
    formType: 'add',
  });
  const formRef = ref(null);

  const formTitle = computed(() => {
    switch (state.formType) {
      case 'restart':
        return '重新启动';
      case 'add':
      default:
        return '新建连接';
    }
  });

  const createConnection = () => {
    state.formType = 'add';
    state.formVisible = true;
    nextTick(() => {
      formRef.value.initForm();
    });
  };

  const doRestartConnection = (connection) => {
    state.formType = 'restart';
    state.formVisible = true;
    nextTick(() => {
      formRef.value.initForm(connection);
    });
  };

  const onFormSubmit = () => {
    formRef.value.validate((form) => {
      let submitFn;
      let submitMsg;
      switch (state.formType) {
        case 'add':
          submitFn = createTerminal;
          submitMsg = '连接创建成功';
          break;
        case 'restart':
          submitFn = restartTerminal;
          submitMsg = '连接重启成功';
          break;
        // no default
      }
      if (submitFn) {
        state.formLoading = true;
        submitFn(form)
          .then(({ name }) => {
            state.formVisible = false;
            Message.success(submitMsg);
            getTerminals().then(() => {
              jumpToAnchor(`#${name}`); // 创建、修改完之后直接跳转到对应连接的位置
            });
          })
          .finally(() => {
            state.formLoading = false;
          });
      }
    });
  };

  const onFormClose = () => {
    formRef.value.resetForm();
  };

  return {
    ...toRefs(state),
    formRef,
    formTitle,
    createConnection,
    doRestartConnection,
    onFormSubmit,
    onFormClose,
  };
};

// 单个连接的保存、删除、重启等入口
const useConnection = ({ doRestartConnection, getTerminals, doPreserveConnection }) => {
  const prereserveConnection = (connection) => {
    doPreserveConnection(connection);
  };
  const restartConnection = (connection) => {
    doRestartConnection(connection);
  };
  const deleteConnection = (connection) => {
    MessageBox.confirm(`确认删除连接 ${connection.name}`, '请确认').then(() => {
      deleteTerminal(connection.id).then(() => {
        Message.success('连接删除成功');
        getTerminals();
      });
    });
  };

  const canRestart = (connection) => {
    return [TERMINAL_STATUS_ENUM.FAILED, TERMINAL_STATUS_ENUM.STOPPED].includes(connection.status);
  };

  const canSave = (connection) => connection.status === TERMINAL_STATUS_ENUM.RUNNING;

  return {
    prereserveConnection,
    restartConnection,
    deleteConnection,

    canRestart,
    canSave,
  };
};

// 保存并停止功能
const usePreserveForm = ({ getTerminals }) => {
  const state = reactive({
    preserveFormVisible: false,
    preserveFormLoading: false,
  });
  const preserveFormRef = ref(null);

  const onPreserveFormSubmit = () => {
    preserveFormRef.value.validate((form) => {
      state.preserveFormLoading = true;
      preserveTerminal(form)
        .then(() => {
          state.preserveFormVisible = false;
          Message.success('保存并停止连接成功');
          getTerminals();
        })
        .finally(() => {
          state.preserveFormLoading = false;
        });
    });
  };

  const doPreserveConnection = (connection) => {
    state.preserveFormVisible = true;
    nextTick(() => {
      preserveFormRef.value.initForm(connection);
    });
  };

  const onPreserveFormClose = () => {
    preserveFormRef.value.resetForm();
  };

  return {
    ...toRefs(state),
    preserveFormRef,
    onPreserveFormSubmit,
    onPreserveFormClose,
    doPreserveConnection,
  };
};

export default {
  name: 'TerminalRemote',
  components: {
    BaseTable,
    BaseModal,
    ConnectionForm,
    PreserveForm,
    MsgPopover,
  },
  setup(props, { root }) {
    const terminalNameMap = generateMap(TERMINAL_STATUS_MAP, 'name');
    const terminalTagMap = generateMap(TERMINAL_STATUS_MAP, 'tagMap');
    const terminalInfoNameMap = generateMap(TERMINAL_INFO_STATUS_MAP, 'name');
    const terminalInfoTagMap = generateMap(TERMINAL_INFO_STATUS_MAP, 'tagMap');

    const { terminalList: connectionList, getTerminals } = useGetTerminals();

    // 锚点跳转
    const jumpToAnchor = (anchor) => {
      anchor = anchor || root.$route.hash;
      if (anchor) {
        moveToAnchor(anchor);
      }
    };

    // 轮询
    const stopFn = () => {
      return Boolean(
        connectionList.value.find((terminal) => {
          return (
            [TERMINAL_STATUS_ENUM.RUNNING, TERMINAL_STATUS_ENUM.SAVING].includes(terminal.status) ||
            terminal.info.find((pod) =>
              [TERMINAL_INFO_STATUS_ENUM.PENDING, TERMINAL_INFO_STATUS_ENUM.RUNNING].includes(
                pod.status
              )
            )
          );
        })
      );
    };
    let firstPoll = true;
    const { startPoll, stopPoll } = usePoll({
      pollFn: async () => {
        await getTerminals();
        // 第一次轮询结果出来之后进行锚点跳转
        if (firstPoll) {
          firstPoll = false;
          setTimeout(() => {
            jumpToAnchor();
          }, 500);
        }
      },
      stopFn,
    });
    startPoll();
    onUnmounted(() => {
      stopPoll();
    });

    // 资源规格跳转
    const onJumpIn = () => {
      setTimeout(jumpToAnchor);
    };
    emitter.on('jumpToTerminalRemote', onJumpIn);
    onUnmounted(() => {
      emitter.off('jumpToTerminalRemote', onJumpIn);
    });

    const {
      formRef,
      createConnection,
      doRestartConnection,
      formVisible,
      formLoading,
      formTitle,
      onFormSubmit,
      onFormClose,
    } = useConnectionForm({ getTerminals: startPoll, jumpToAnchor });

    const {
      preserveFormVisible,
      preserveFormLoading,
      preserveFormRef,
      onPreserveFormSubmit,
      onPreserveFormClose,
      doPreserveConnection,
    } = usePreserveForm({ getTerminals: startPoll });

    const {
      prereserveConnection,
      restartConnection,
      deleteConnection,
      canRestart,
      canSave,
    } = useConnection({
      doRestartConnection,
      getTerminals: startPoll,
      doPreserveConnection,
    });

    // 判断是否具有 statusDetail 信息
    const hasStatusDetail = (detail) => {
      return detail && detail !== '{}';
    };

    return {
      TERMINAL_STATUS_ENUM,
      terminalNameMap,
      terminalTagMap,
      terminalInfoNameMap,
      terminalInfoTagMap,

      formRef,
      createConnection,
      formVisible,
      formLoading,
      formTitle,
      onFormSubmit,
      onFormClose,

      connectionList,
      prereserveConnection,
      restartConnection,
      deleteConnection,
      canRestart,
      canSave,

      connectionNodeTableColumns,

      // 保存并停止
      preserveFormVisible,
      preserveFormLoading,
      preserveFormRef,
      onPreserveFormSubmit,
      onPreserveFormClose,

      hasStatusDetail,
    };
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

#pro-remote-wrapper {
  max-width: 1400px;
  margin: 0 100px;
}

.ts-tip {
  ol {
    padding-left: 20px;

    li {
      line-height: 24px;
      list-style-type: decimal;
    }
  }
}

.info-row {
  margin-bottom: 10px;
  line-height: 30px;
}

.info-title {
  display: inline-block;
  width: 150px;
  font-weight: 700;
}

.empty-connection-wrapper {
  color: $infoColor;
  text-align: center;
}
</style>
