# Copyright (c) opensource-china Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import os
import time
import shutil
import logging
import tempfile

from ..common import linux_shell
from ...confStorage.upload import UploadConfiguration
from ...confStorage.download import download_configuration


class TempConfig:

    def __init__(self, kube_config_path=None):
        self._logger = logging.getLogger(__name__)
        self._kube_config_path = None
        if kube_config_path != None:
            self._kube_config_path = os.path.expanduser(kube_config_path)
        self._tmp_dir = tempfile.mkdtemp(prefix='.pai-config-', dir=tempfile.gettempdir())
        self._pull_config_files()
        self._generate_config_files()

    def _pull_config_files(self):
        self._logger.info("Pull config from k8s cluster: `layout.yaml` and `config.yaml`")
        pull_handler = download_configuration(
            config_output_path=self._tmp_dir,
            kube_config_path=self._kube_config_path
        )
        pull_handler.run()
    
    def push_config_files(self, file_list):
        self._logger.info("Push config to k8s cluster: {}".format(", ".join(["`{}`".format(file_name) for file_name in file_list])))
        push_handler = UploadConfiguration(
            config_path=self._tmp_dir,
            kube_config_path=self._kube_config_path,
            upload_list=file_list
        )
        push_handler.run()

    def _generate_config_files(self):
        self._logger.info("Generate config files: `hosts.yml` and `opensourceai.yml`")
        linux_shell.execute_shell_raise(
            shell_cmd="cd ./contrib/kubespray/ && python3 ./script/k8s_generator.py -l {} -c {} -o {}".format(
                os.path.join(self._tmp_dir, "layout.yaml"),
                os.path.join(self._tmp_dir, "config.yaml"),
                self._tmp_dir
            ),
            error_msg="Failed to generate config files"
        )

    def __del__(self):
        self._logger.info("Remove temporary config folder")
        try:
            shutil.rmtree(self._tmp_dir)
        except Exception as e:
            self._logger.error(str(e))
            self._logger.error("Failed to remove temporary config folder: {}, please remove it manually".format(self._tmp_dir))

    def get_hosts_yml_path(self):
        return os.path.join(self._tmp_dir, "hosts.yml")

    def get_opensourceai_yml_path(self):
        return os.path.join(self._tmp_dir, "opensourceai.yml")

    def get_layout_yaml_path(self):
        return os.path.join(self._tmp_dir, "layout.yaml")
