/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <Classification :templateType="templateType" />
</template>
<script>
import { ref, onBeforeMount, computed, provide } from '@vue/composition-api';

import { detail } from '@/api/preparation/dataset';
import { templateTypeSymbol, matchTemplateByDataset } from '@/views/dataset/util';
import Classification from './Classification';

export default {
  name: 'ImageClassification',
  components: {
    Classification,
  },
  setup(props, ctx) {
    const { $route } = ctx.root;
    const { params = {} } = $route;

    const datasetInfo = ref(null);

    const templateType = computed(() => {
      if (!datasetInfo.value) return null;
      return matchTemplateByDataset(datasetInfo.value);
    });

    onBeforeMount(async () => {
      const res = await detail(params.datasetId);
      datasetInfo.value = res;
    });

    provide(templateTypeSymbol, templateType);

    return {
      datasetInfo,
      templateType,
    };
  },
};
</script>
