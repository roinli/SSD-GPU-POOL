/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="app-container">
    <el-row v-loading="loading" class="card-row">
      <!-- 非管理员不能上传和编辑 -->
      <el-col v-if="isAdmin" :xs="12" :sm="12" :lg="6" :xl="4" class="card-col">
        <el-card shadow="always">
          <div class="upload flex flex-center" @click="onDrawerShow('create')">
            <span>
              <i class="el-icon-plus"></i>
              上传搜索策略
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col
        v-for="item in algorithmList"
        :key="item.id"
        :xs="12"
        :sm="12"
        :lg="6"
        :xl="4"
        class="card-col"
      >
        <el-card shadow="hover">
          <!-- 卡片头部 -->
          <div class="flex flex-between card-title">
            <label>{{ item.name }}</label>
            <el-dropdown v-if="item.algorithmVersionVOList.length > 1" @command="onVersionChange">
              <span class="el-dropdown-link">
                {{ item.selectedVersionName }}<i class="el-icon-arrow-down el-icon--right"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item v-for="v in item.algorithmVersionVOList" :key="v.id" :command="v">
                  {{ v.versionName || '最新' }}
                  <el-button
                    v-if="v.versionName"
                    class="dropdown-del-btn"
                    type="text"
                    @click.stop="doDelete(item, v)"
                    ><i class="el-icon-close"
                  /></el-button>
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
          <!-- 标签 -->
          <div class="tag">
            <i class="el-icon-price-tag tag-icon" />
            <el-tag class="ml-10">{{ item.algType }}</el-tag>
          </div>
          <!-- 文本内容 -->
          <p class="introduce multiple-lines">
            {{ item.description }}
          </p>
          <el-divider />
          <!-- 卡片操作按钮 -->
          <div class="operation-wrapper flex flex-around">
            <!-- 非管理员不能上传和编辑 -->
            <template v-if="isAdmin">
              <el-tooltip effect="dark" :content="getEditContent(item)" placement="bottom">
                <i
                  class="cp iconfont icon-bianji"
                  :class="{ 'i-disabled': item.isReleased }"
                  @click.stop="onDrawerShow('edit', item)"
                />
              </el-tooltip>
              <el-divider direction="vertical" />
            </template>
            <el-tooltip effect="dark" content="查看搜索策略" placement="bottom">
              <i class="cp iconfont icon-chaxun" @click.stop="onDrawerShow('check', item)" />
            </el-tooltip>
            <el-divider direction="vertical" />
            <el-tooltip effect="dark" :content="getCreateContent(item)" placement="bottom">
              <i
                class="cp iconfont icon-shiyanguanli"
                :class="{ 'i-disabled': !item.isReleased }"
                @click.stop="doCreate(item)"
              />
            </el-tooltip>
            <!-- 非管理员不能发布和删除 -->
            <template v-if="isAdmin">
              <el-divider direction="vertical" />
              <el-tooltip effect="dark" :content="getReleaseContent(item)" placement="bottom">
                <i
                  class="cp iconfont icon-fabu"
                  :class="{ 'i-disabled': item.isReleased }"
                  @click.stop="doRelease(item)"
                />
              </el-tooltip>
              <el-divider direction="vertical" />
              <el-tooltip effect="dark" content="删除算法" placement="bottom">
                <i class="cp iconfont icon-shanchu" @click.stop="doDelete(item)" />
              </el-tooltip>
            </template>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <!-- 上传/编辑/查看抽屉 -->
    <StrategyDrawer ref="strategyDrawer" @submit-success="submitSuccess" />
    <!-- 发布搜索策略弹窗 -->
    <ReleaseDialog ref="releaseDialog" @release-success="releaseSuccess" />
  </div>
</template>

<script>
import { reactive, toRefs, onMounted } from '@vue/composition-api';
import { Message, MessageBox } from 'element-ui';

import { getStrategyList, getNextVersion, shiftVersion, deleteVersion } from '@/api/tadl/strategy';
import { useMapGetters } from '@/hooks';

import StrategyDrawer from './components/StrategyDrawer';
import ReleaseDialog from './components/ReleaseDialog';

const useGetAlgorithms = () => {
  const state = reactive({
    algorithmList: [], // 接口获取的算法列表
    loading: false,
  });

  // 列表刷新及搜索
  const refreshList = async (content) => {
    state.loading = true;
    state.algorithmList = await getStrategyList({ content }).finally(() => {
      state.loading = false;
    });
    // 为算法添加当前版本信息
    state.algorithmList.forEach((algorithm) => {
      const selectedVersion = algorithm.algorithmVersionVOList.find(
        (v) => v.id === algorithm.algorithmVersionId
      );
      if (selectedVersion) {
        algorithm.selectedVersionName = selectedVersion.versionName || '最新';
        algorithm.isReleased = selectedVersion.versionName !== null;
      } else {
        algorithm.selectedVersionName = '选择版本';
        algorithm.isReleased = false;
      }
    });
  };

  return {
    ...toRefs(state),
    refreshList,
  };
};

export default {
  name: 'Strategy',
  components: { StrategyDrawer, ReleaseDialog },
  setup(props, ctx) {
    const refs = reactive({
      strategyDrawer: null,
      releaseDialog: null,
    });

    const { isAdmin } = useMapGetters(['isAdmin']);

    const { algorithmList, loading, refreshList } = useGetAlgorithms();

    const onDrawerShow = async (type, item = {}) => {
      if (!(type === 'edit' && item.isReleased)) {
        refs.strategyDrawer.handleShow(type, item);
      }
    };

    const doRelease = async (info) => {
      if (info.isReleased) return;
      const version = info.algorithmVersionVOList.find((v) => v.id === info.algorithmVersionId);
      if (version) {
        const releaseObj = await getNextVersion(version.algorithmId);
        refs.releaseDialog.handleShow(releaseObj);
      }
    };

    const onVersionChange = ({ algorithmId, id }) => {
      shiftVersion({ algorithmId, algorithmVersionId: id }).then(() => refreshList());
    };

    const submitSuccess = () => {
      refreshList();
    };

    const releaseSuccess = () => {
      refreshList();
    };

    const doCreate = ({ id, algorithmVersionId, isReleased }) => {
      if (!isReleased) return;
      ctx.root.$router.push({
        name: 'TadlForm',
        params: {
          formType: 'strategy',
          formParams: {
            algorithmId: id,
            algorithmVersionId,
          },
        },
      });
    };

    const doDelete = ({ name, id }, version) => {
      MessageBox.confirm(
        version
          ? `确认删除算法${name}的${version.versionName}版本？`
          : `删除算法${name}会同时删除其所有版本，是否确认？`,
        '确认'
      ).then(async () => {
        await deleteVersion({
          algorithmId: id,
          algorithmVersionId: version ? version.id : undefined,
        });
        Message.success('算法删除成功！');
        refreshList();
      });
    };

    const getEditContent = ({ isReleased }) =>
      isReleased ? '编辑只可用于最新版本' : '编辑搜索策略';
    const getReleaseContent = ({ isReleased }) => (isReleased ? '发布只可用于最新版本' : '发布');
    const getCreateContent = ({ isReleased }) =>
      isReleased ? '创建实验' : '只有已发布版本才能创建实验';

    onMounted(() => {
      refreshList();
    });

    return {
      ...toRefs(refs),
      isAdmin,

      algorithmList,
      loading,
      submitSuccess,
      releaseSuccess,
      onDrawerShow,
      doRelease,
      onVersionChange,
      doCreate,
      doDelete,
      getEditContent,
      getReleaseContent,
      getCreateContent,
    };
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.i-disabled {
  color: #909399;
  cursor: not-allowed;
}

.divider {
  height: 12px;
  margin-bottom: 20px;
  background: #f5f7fa;
}

.card-col {
  padding: 0 10px;
  margin: 10px 0;

  .upload {
    height: 175px;
    color: #88898a;
    cursor: pointer;
  }

  .card-title {
    height: 20px;
    margin-bottom: 10px;
  }

  .tag {
    height: 23px;
    margin: 10px 0;

    .tag-icon {
      font-size: 18px;
      color: #000;
      transform: rotate(-30deg);
    }
  }

  .introduce {
    height: 65px;
    font-size: 14px;
    color: rgba(146, 146, 146, 100);
    -webkit-line-clamp: 4;
  }

  .el-divider--horizontal {
    margin: 10px 0;
  }

  .el-dropdown-link {
    color: #2e4fde;
    cursor: pointer;
  }

  .el-icon-arrow-down {
    font-size: 12px;
  }
}

.dropdown-del-btn {
  float: right;
  margin: 0 -10px 0 10px;
  line-height: 18px;
  color: $infoColor;

  :hover {
    color: $primaryHoverColor;
  }
}
</style>
