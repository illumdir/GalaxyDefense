#!/bin/bash
# Deploy GalaxyDefense to NAS (nginx:alpine at /volume1/docker/galaxydefense/www)

NAS="illumdir@192.168.2.31"
DEST="/volume1/docker/galaxydefense/www"

echo "Deploying GalaxyDefense to NAS..."

scp -O -r index.html css/ js/ data/ "${NAS}:${DEST}/"

echo "Done. App available at http://192.168.2.31:8086"
