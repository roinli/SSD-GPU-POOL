/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div>
    <InfoSelect
      v-if="mode === 'edit'"
      class="labelSelect"
      :dataSource="labelList"
      labelKey="name"
      valueKey="id"
      placeholder="请选择标签"
      :value="row.id"
      :clearable="false"
      @change="handleChange"
    />
    <span v-else>{{ row.label }}</span>
  </div>
</template>
<script>
import { computed } from '@vue/composition-api';

import InfoSelect from '@/components/InfoSelect';

export default {
  name: 'LabelName',
  components: {
    InfoSelect,
  },
  props: {
    row: {
      type: Object,
      default: () => ({}),
    },
    labelList: {
      type: Array,
      default: () => [],
    },
    editId: Number,
    mode: String,
  },
  setup(props, ctx) {
    const attrs = computed(() => ctx.attrs);

    const handleChange = (value) => {
      ctx.emit('change', value, props.row);
    };

    return {
      attrs,
      handleChange,
    };
  },
};
</script>
