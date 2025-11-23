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

import { computed, ref } from '@vue/composition-api';

import BaseTable from '@/components/BaseTable';
import BaseModal from '@/components/BaseModal';
import { getStatisticsColumns } from '../../../util';
import '../../style.scss';

export default {
  name: 'StatisticsModal',
  components: {
    BaseTable,
    BaseModal,
  },
  setup() {
    const visibleValue = ref(false);
    const dataSource = ref([]);

    const columns = computed(() => getStatisticsColumns());

    const showModal = (source) => {
      visibleValue.value = true;
      dataSource.value = source;
    };

    return { visibleValue, dataSource, columns, showModal };
  },
  render() {
    return (
      <BaseModal
        visible={this.visibleValue}
        title="标注统计"
        width="700px"
        class="el-modal__dark"
        ok-text="确认"
        show-cancel={false}
        show-close={false}
        onOk={() => {
          this.visibleValue = false;
        }}
      >
        <BaseTable size="small" columns={this.columns} data={this.dataSource} row-key="label" />
      </BaseModal>
    );
  },
};
