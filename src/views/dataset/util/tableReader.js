/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

import PapaParse from 'papaparse';
import { read, utils } from 'xlsx';
import { promisifyFileReader } from '@/utils';

export const csvReader = (file) => {
  return promisifyFileReader(file, 'utf-8').then((raw) => {
    const { data } = PapaParse.parse(raw);
    const columns = data[0];
    const parsed = data.slice(1);
    return { data: parsed, columns };
  });
};

function get_header_row(sheet) {
  const headers = [];
  // sheet['!ref']表示所有单元格的范围，例如从A1到F8则记录为 A1:F8
  const range = utils.decode_range(sheet['!ref']);
  // 从第一行开始
  const R = range.s.r;
  // 按列进行数据遍历
  for (let C = range.s.c; C <= range.e.c; C += 1) {
    // 查找第一行中的单元格
    const cell = sheet[utils.encode_cell({ c: C, r: R })];
    if (cell && cell.t) {
      const hdr = utils.format_cell(cell);
      headers.push(hdr);
    }
  }
  return headers;
}

export const xlsReader = (file) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = (e) => {
      const bytes = e.target.result;
      const workbook = read(bytes, { type: 'binary' });
      // 获取第一个 sheet
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      const data = utils.sheet_to_json(ws, { header: 1 });
      // 获取列信息
      const columns = get_header_row(ws);
      resolve({ data: data.slice(1), columns });
    };
    reader.onerror = (e) => {
      reject(new Error(e));
    };
    reader.readAsBinaryString(file);
  });
};
