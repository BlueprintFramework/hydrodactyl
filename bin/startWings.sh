podman run -d \
  --name wings \
  --restart unless-stopped \
  --network host \
  --cap-add=NET_ADMIN \
  -e TZ="$(timedatectl show -p Timezone --value 2>/dev/null || echo UTC)" \
  -v "$PWD/srv/config/config.yaml:/etc/pterodactyl/config.yml" \
  -v "$PWD/srv/pterodactyl:/var/lib/pterodactyl" \
  -v "$PWD/srv/pterodactyl/tmp:/tmp/pterodactyl" \
  -v "/run/user/1000/podman/podman.sock:/var/run/docker.sock" \
  ghcr.io/pterodactyl/wings:latest

podman run -d \
  --name calagopus \
  --restart unless-stopped \
  --network host \
  --cap-add=NET_ADMIN \
  -e TZ="$(timedatectl show -p Timezone --value 2>/dev/null || echo UTC)" \
  -e WINGS_UID=988 \
  -e WINGS_GID=988 \
  -e WINGS_USERNAME=calagopus \
  -v "$PWD/srv/config-calagopus:/etc/calagopus-wings" \
  -v "$PWD/srv/calagopus-wings:/var/lib/calagopus-wings" \
  -v "$PWD/srv/logs:/var/log/calagopus-wings" \
  -v "$PWD/srv/tmp:/tmp/calagopus-wings" \
  -v "/run/user/1000/podman/podman.sock:/var/run/docker.sock" \
  ghcr.io/calagopus/wings:latest

