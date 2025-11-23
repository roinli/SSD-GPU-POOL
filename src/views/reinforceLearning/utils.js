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
import { ATLAS_ALGORITHM_NAME_ENUM } from '@/utils/constant';
/* eslint-disable global-require */

export const atlasAlgorithmList = [
  {
    en: 'DQN',
    cn: 'Deep Q-Network',
    description: [
      'DQN 是 Q-learning 算法的升级版，使⽤深度神经⽹络来近似状态⾏为价值函数 Q。使⽤经验回放(Experience Replay) 来训练强化学习模型。使⽤两个 Q ⽹络，即添加 Target Network 来使得训练震荡发散可能性降低，更加稳定。',
    ],
    paperLink: 'https://www.cs.toronto.edu/~vmnih/docs/dqn.pdf',
    img: require('@/assets/images/learning/DQN.gif'),
    id: ATLAS_ALGORITHM_NAME_ENUM.DQN,
  },
  {
    en: 'D4PG',
    cn: 'Distributed distributional deterministic policy gradients',
    description: [
      '这篇 paper 是 DeepMind 提出的⼀种 DDPG 的改进，从 title 就可以看出来，这个⽅法⼤概率是 DeepMind 在业务中对 DDPG 结合了若⼲ advanced techniques 得到的 DDPG variant。',
      '总的来说，D4PG 在 DDPG 的基础上，增加了以下⼏点：\n1）distributional RL \n2）distributed sampling (APEX)\n3）N-step returns    \n4）Prioritized Experience Replay (PER) ',
    ],
    paperLink: 'https://arxiv.org/pdf/1804.08617.pdf',
    img: require('@/assets/images/learning/D4PG.gif'),
    id: ATLAS_ALGORITHM_NAME_ENUM.D4PG,
  },
];
