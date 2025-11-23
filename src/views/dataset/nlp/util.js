/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

/** MIT License
Copyright (c) 2020 Alien ZHOU

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */

/* eslint-disable */

// 参考来源：https://github.com/alienzhou/web-highlighter/blob/1b26fe5927/src/util/uuid.ts
export function createUUID(a) {
  return a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/gu, createUUID);
}

// 将原始值（highlightSource）转化为 json
// [{ startMeta: {parentIndex: 0, parentTagName: "PRE", textOffset: 64 }, endMeta: { parentIndex: 0, parentTagName: "PRE", textOffset: 82 }, id: 'xxx', text: 'text', __isHighlightSource: {} }]
export const hs2Json = raw => {
  return raw.map(d => {
    const result = {
      offset: [d.startMeta.textOffset, d.endMeta.textOffset],
      text: d.text,
    };
    if (d.extra && d.extra.labelId) {
      Object.assign(result, {
        labelId: d.extra.labelId, // 对应的标签
      });
    }
    return result;
  });
};

export const json2Hs = arr => {
  return arr.map(d => {
    const res = {
      startMeta: { parentIndex: 0, parentTagName: 'PRE', textOffset: d.offset?.[0] },
      endMeta: { parentIndex: 0, parentTagName: 'PRE', textOffset: d.offset?.[1] },
      id: createUUID(),
      text: d.text,
      __isHighlightSource: {},
    };
    if (d.labelId) {
      res.extra = {
        labelId: d.labelId,
        type: 'from-store',
      };
    }
    return res;
  });
};
