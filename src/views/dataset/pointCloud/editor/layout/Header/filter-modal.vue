/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */
<template>
  <BaseModal
    :visible.sync="visibleValue"
    title="文件筛选"
    width="700px"
    class="el-modal__dark"
    @cancel="visibleValue = false"
    @close="checkList = []"
    @ok="handleOk"
  >
    <div class="flex">
      <label class="mr-10" style="color: #dbdbdb;">标注状态:</label>
      <el-checkbox-group v-model="checkList">
        <el-checkbox v-for="map in stateMap" :key="map.key" :label="map.key">{{
          map.val
        }}</el-checkbox>
      </el-checkbox-group>
    </div>
  </BaseModal>
</template>
<script>
import { computed, ref } from '@vue/composition-api';

import BaseModal from '@/components/BaseModal';
import { fileStatusMap } from '@/views/dataset/pointCloud/util';

export default {
  name: 'FilterModal',
  components: { BaseModal },
  setup() {
    const visibleValue = ref(false);
    const checkList = ref([]);
    const editor = ref(null);
    const stateMap = computed(() =>
      Object.entries(fileStatusMap).map(([key, val]) => ({ key, val }))
    );

    const showModal = (data) => {
      visibleValue.value = true;
      editor.value = data;
    };

    const handleOk = async () => {
      const params = checkList.value.some((d) => d === 'undefined')
        ? { datasetId: editor.value.data.datasetId }
        : { datasetId: editor.value.data.datasetId, markStatus: checkList.value };
      await editor.value.data.getFilesList(params);
      editor.value.resetEditor();
      editor.value.data.setCurrentIndex(0);
      visibleValue.value = false;
    };

    return { visibleValue, checkList, stateMap, showModal, handleOk };
  },
};
</script>
<style lang="scss" scoped>
@import '../../style.scss';
</style>
