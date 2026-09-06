#!/bin/bash

lerd setup -a
./bin/s3Setup.sh .env
lerd artisan p:location:make -n --short local --long Local > /dev/null
lerd artisan p:node:make -n --name local --description "Development Node" --locationId 1 --fqdn localhost --internal-fqdn host.containers.internal --public 1 --scheme http --proxy 1 --daemonListeningPort 8080 --maxMemory 1024 --maxDisk 10240 --overallocateMemory 0 --overallocateDisk 0 --daemonType wings --backupDisk s3 --bucket 1 > /dev/null

mkdir -p "$PWD/srv/config"
lerd artisan p:node:configuration 1 > "$PWD/srv/config/config.yaml"

mkdir -p "$PWD/srv/pterodactyl/tmp"
sed -i "s#/etc/pterodactyl#${PWD}/srv/pterodactyl#g" "$PWD/srv/config/config.yaml"

./bin/startWings.sh
