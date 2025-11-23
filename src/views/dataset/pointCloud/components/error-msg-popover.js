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

import '../editor/style.scss';

export default {
  name: 'ErrorMsgPopover',
  functional: true,
  props: {
    text: String,
    color: String,
    statusDetail: String,
  },
  render(h, { props }) {
    const { text, color, statusDetail } = props;

    try {
      const msg = Object.values(JSON.parse(statusDetail));
      return (
        <div>
          <span class={`tag-status-${color}`}>{text}</span>
          <el-popover title={undefined} trigger="hover" placement="right" content={msg[0]}>
            <i slot="reference" class="el-icon-warning-outline primary f16 v-text-top ml-4" />
          </el-popover>
        </div>
      );
    } catch (e) {
      return <span class={`tag-status-${color}`}>{text}</span>;
    }
  },
};
