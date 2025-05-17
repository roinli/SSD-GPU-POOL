#!/bin/bash
set -e

echo "pai" > cluster-id

# assume the workdir is pai
echo "Generating services configurations..."
python3 ./contrib/kubespray/script/opensourceai_generator.py -l ./contrib/kubespray/config/layout.yaml -c ./contrib/kubespray/config/config.yaml -o /cluster-configuration

echo "Pushing cluster config to k8s..." 
./paictl.py config push -p /cluster-configuration -m service < cluster-id

echo "Starting opensourceai service..."
./paictl.py service start < cluster-id

rm cluster-id
