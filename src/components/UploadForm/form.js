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

import axios from 'axios';
import { Message } from 'element-ui';
import './style.scss';

// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');

let msgInstance;

const defaultAccept = (d) => `${d} MB`;

export default {
  name: 'UploadForm',
  props: {
    action: String,
    accept: {
      type: String,
      default: '.jpg,.png,.bmp,.jpeg',
    },
    acceptSize: {
      type: Number, // 如果传入 0 代表不限制
      default: 5, // MB
    },
    acceptSizeFormat: {
      // 格式化文本
      type: Function,
      default: defaultAccept,
    },
    limit: {
      type: Number,
      default: 5000,
    },
    showFileCount: {
      type: Boolean,
      default: true,
    },
    dataType: {
      type: String,
      default: 'visual',
    },
    /**
     * filters 数组要求：
     * 1. 成员需要有一个 judge 方法返回布尔值，来判断是否需要过滤文件
     * 2. 成员需要有一个 message 属性，用来展示提示信息
     */
    filters: {
      type: Array,
      default: () => [],
      validator: (value) => {
        for (const filter of value) {
          if (!filter.message || typeof filter.judge !== 'function') {
            return false;
          }
        }
        return true;
      },
    },
  },
  data() {
    return {
      uploading: false,
      lenOfFileList: 0,
      source: axios.CancelToken.source(),
    };
  },
  computed: {
    acceptFormatStr() {
      const formats = this.accept.split(',');
      return formats.join('/');
    },
  },
  methods: {
    onMessageClose() {
      // 清理 message 实例
      msgInstance = null;
    },
    reset() {
      this.$refs.uploader.clearFiles();
      this.lenOfFileList = 0;
    },
    /**
     * 标准文件过滤入口，返回布尔值
     * @param {*} file 被过滤文件
     * @param {*} fileList 文件列表
     * @param {Boolean} bool 如果布尔值为 true 则过滤改文件
     * @param {*} message Message 信息
     * @return {Boolean} 返回传入的布尔值
     */
    addFileFilter(file, fileList, bool, message) {
      if (bool) {
        fileList.splice(fileList.indexOf(file), 1);
        if (!msgInstance) {
          msgInstance = Message.info({
            message,
            onClose: this.onMessageClose,
          });
        }
      }
      return bool;
    },
    fileChange(file, fileList) {
      // 根据后缀名进行格式匹配
      const acceptTypes = this.accept.split(',');
      const extname = path.extname(file.raw.name);
      const mimeType = acceptTypes.includes(extname.toLowerCase());

      const addFilter = this.addFileFilter.bind(this, file, fileList);

      // 不限定文件格式时跳过验证
      if (this.accept !== 'unspecified' && addFilter(!mimeType, '文件格式不支持')) {
        return;
      }

      // acceptSize 支持传入 0 代表不限制大小
      const isOverSize = this.acceptSize !== 0 && file.size / (1024 * 1024) > this.acceptSize;
      if (addFilter(isOverSize, `不能添加大于${this.acceptSize}MB的文件`)) {
        return;
      }

      for (const item of fileList.slice(0, fileList.length - 1)) {
        if (addFilter(item.name === file.name, '不能添加文件名相同的文件')) {
          return;
        }
      }

      for (const filter of this.filters) {
        if (addFilter(filter.judge(file, fileList), filter.message)) {
          return;
        }
      }

      this.lenOfFileList = fileList.length;
      // 触发文件变动事件
      this.$emit('fileChange', file, fileList);
    },
    onProgress(res) {
      const { loaded } = res;
      const { total } = res;
      const uploadPercent =
        Math.floor((loaded / total) * 100) > 1 ? Math.floor((loaded / total) * 100) : 1;
      this.$emit('onUploadPercent', uploadPercent);
    },
    onRemove(file, fileList) {
      this.lenOfFileList = fileList.length;
      this.$attrs['on-remove'] && this.$attrs['on-remove'](file, fileList);
    },
    cancelUpload() {
      if (this.source) {
        this.source.cancel('取消上传');
      }
    },
    onExceed(files, fileList) {
      if (files.length > this.limit || fileList.length > this.limit) {
        Message.info(`单次上传文件数量不能超过${this.limit}`);
      }
    },
  },
  render() {
    // vue jsx 属性传递需要把 on- 放到 props 内
    // 详细参考：https://zhuanlan.zhihu.com/p/37920151
    const uploadProps = {
      props: {
        onChange: this.fileChange,
        onRemove: this.onRemove,
        onExceed: this.onExceed,
        ...this.$attrs,
      },
      ref: 'uploader',
    };

    return (
      <div id="upload-form-style" class="upload-form">
        <el-upload
          action={this.action}
          accept={this.accept}
          class="upload-field"
          limit={this.limit}
          multiple
          list-type={this.lenOfFileList > 100 || this.dataType === 'text' ? 'text' : 'picture'}
          auto-upload={false}
          disabled={this.uploading}
          {...uploadProps}
        >
          <el-button
            disabled={this.uploading || this.$attrs.disabled}
            size="mini"
            icon="el-icon-upload"
          >
            上传文件
          </el-button>
          <div slot="tip" class="flex f1 flex-between" style="margin-left: 20px;">
            <div class="upload-tip">
              {this.accept === 'unspecified' ? (
                <span>文件格式不限</span>
              ) : (
                <span>文件格式：{this.acceptFormatStr}</span>
              )}
              {this.acceptSize > 0 && (
                <span>, 单个文件不大于 {this.acceptSizeFormat(this.acceptSize)}</span>
              )}
            </div>
            {this.showFileCount && (
              <span class="upload-chosen-tip">已选择 {this.lenOfFileList} 个</span>
            )}
          </div>
        </el-upload>
      </div>
    );
  },
};
