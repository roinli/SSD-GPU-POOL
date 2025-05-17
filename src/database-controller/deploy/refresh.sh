#!/bin/bash

# Copyright (c) opensource-china Corporation.
# Licensed under the MIT License.

pushd $(dirname "$0") > /dev/null

bash stop.sh
bash start.sh

popd > /dev/null
