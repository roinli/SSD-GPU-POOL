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

const StrategyMap = {
  Max(tag, number, data) {
    return context('max', tag, number, data);
  },
  Min(tag, number, data) {
    return context('min', tag, number, data);
  },
  Quar(tag, number, data) {
    return context('quar', tag, number, data);
  },
  Vari(tag, number, data) {
    return context('vari', tag, number, data);
  },
};

const context = function(metric, tag, number, data) {
  return filterMap[tag] && filterMap[tag](metric, number, data);
};

const filterMap = {
  '<': function(metric, number, data) {
    return data.filter((item) => item[metric] < number);
  },
  '<=': function(metric, number, data) {
    return data.filter((item) => item[metric] <= number);
  },
  '>=': function(metric, number, data) {
    return data.filter((item) => item[metric] >= number);
  },
  '>': function(metric, number, data) {
    return data.filter((item) => item[metric] > number);
  },
};

export default StrategyMap;
