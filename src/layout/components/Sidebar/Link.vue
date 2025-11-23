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

<template>
  <a v-if="isExternal" target="_blank" rel="noopener noreferrer" @click="handleGoExternal">
    <slot />
  </a>
  <router-link v-else :to="to">
    <slot />
  </router-link>
</template>

<script>
import { getToken } from '@/utils/auth';
import { isExternal } from '@/utils/validate';
import { externalFnMap } from './utils';

export default {
  name: 'AppLink',
  props: {
    to: {
      type: String,
      required: true,
    },
    route: {
      type: Object,
    },
  },
  computed: {
    url() {
      return this.to.replace('{TOKEN}', getToken());
    },
    isExternal() {
      return isExternal(this.to);
    },
    routeName() {
      return this.route ? this.route.name : '';
    },
  },
  methods: {
    async handleGoExternal() {
      let url;
      if (this.routeName && externalFnMap[this.routeName]) {
        url = await externalFnMap[this.routeName](this.url, this.route);
      } else {
        url = this.url;
      }
      window.open(url, '_blank');
    },
  },
};
</script>
