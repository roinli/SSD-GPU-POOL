/*
 * Copyright 2019-2020 Zheng Jie
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Dict from './Dict';

const install = (Vue) => {
  Vue.mixin({
    data() {
      if (this.$options.dicts instanceof Array) {
        const dict = {
          dict: {},
          label: {},
        };
        return {
          dict,
        };
      }
      return {};
    },
    created() {
      if (this.$options.dicts instanceof Array) {
        new Dict(this.dict).init(this.$options.dicts, () => {
          this.$nextTick(() => {
            this.$emit('dictReady');
          });
        });
      }
    },
  });
};

export default { install };
