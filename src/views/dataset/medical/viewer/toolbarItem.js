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

import ToolbarButton from './toolbarButton';
import ToolbarControls from './controls';

const ToolbarItem = {
  name: 'ToolbarItem',
  inheritAttrs: false,
  components: {
    ToolbarButton,
    ToolbarControls,
  },
  props: {
    item: Object,
    activeTool: String,
    wlPreset: String,
    shape: String,
  },
  render() {
    const toolItemProps = {
      props: {
        item: this.item,
        activeTool: this.activeTool,
      },
      on: this.$listeners,
    };
    if (this.item.command === 'Draw') {
      return <ToolbarControls value={this.shape} {...toolItemProps} />;
    }

    if (this.item.command === 'SetWlPreset') {
      return <ToolbarControls value={this.wlPreset} {...toolItemProps} />;
    }

    return <ToolbarButton {...toolItemProps} />;
  },
};

export default ToolbarItem;
