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


import git
import sys
import time
import logging


from ...paiLibrary.common import file_handler
from ...paiLibrary.common import directory_handler



class git_storage:

    def __init__(self, storage_configuration, local_store = "/tmp/pai-conf-sync/git-storage"):

        self.repo_url = storage_configuration["url"]
        self.branch = storage_configuration["branch"]
        self.path = storage_configuration["path"]

        self.time = str(int(time.time()))
        self.logger = logging.getLogger(__name__)
        self.local_store = "{0}-{1}".format(local_store, self.time)



    def git_clone(self):
        try:
            self.repo = git.Repo.clone_from(self.repo_url, self.local_store, branch=self.branch, depth=1)
        except:
            self.logger.error("Failed to clone the repo from [ url: {0},  branch: {1} ]".format(self.repo_url, self.branch))
            sys.exit(1)



    def git_file_clean(self):
        file_handler.file_delete(self.local_store)



    def rm_conf(self):
        pai_temp_path = "./tmp-config-{0}".format(self.time)
        directory_handler.directory_delete(pai_temp_path)



    def get_conf(self):

        configuation_path = "{0}/{1}".format(self.local_store, self.path)
        if not directory_handler.directory_exist_or_not(configuation_path):
            self.logger.error("Unable to find configuration path in the repo.")
            self.logger.error("Path: {0}".format(self.path))
            self.logger.error("Repo: {0}".format(self.repo_url))
            sys.exit(1)

        pai_temp_path = "./tmp-config-{0}".format(self.time)
        directory_handler.directory_copy("{0}/*".format(configuation_path), pai_temp_path)



    def open(self):
        self.git_clone()
        self.get_conf()
        return "./tmp-config-{0}".format(self.time)



    def close(self):
        self.rm_conf()
        self.git_file_clean()



    def __enter__(self):
        return self.open()



    def __exit__(self, type, value, trace):
        self.close()
