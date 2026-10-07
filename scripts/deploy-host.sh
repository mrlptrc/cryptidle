#!/usr/bin/env bash
# Run by SSM as root, from a reviewed release extracted to /opt/cryptidle.
set -euo pipefail
cd /opt/cryptidle
umask 077
image="${1:?Usage: deploy-host.sh ECR_IMAGE_URI_WITH_SHA_TAG}"
[[ "$image" =~ ^[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com/[a-zA-Z0-9/_-]+:[a-f0-9]{40}$ ]] || exit 2
region="$(printf '%s' "$image" | cut -d. -f4)"
aws ssm get-parameter --name /cryptidle/runtime-env --with-decryption --region "$region" --query Parameter.Value --output text > .env.next
chmod 600 .env.next
if [[ -f .env ]]; then cp .env .env.previous; fi
mv .env.next .env
# Parse literal key=value lines without executing parameter contents as shell code.
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"
  [[ -z "$line" || "$line" == \#* ]] && continue
  [[ "$line" =~ ^[A-Z_][A-Z0-9_]*=[a-zA-Z0-9:/._@,+=-]+$ ]] || { echo 'Invalid literal runtime-env line' >&2; exit 2; }
  export "$line"
done < .env
registry="${image%%/*}"
aws ecr get-login-password --region "$region" | docker login --username AWS --password-stdin "$registry"
export APP_IMAGE="$image"
docker compose -f docker-compose.yml -f compose.production.yml pull app migrate caddy
if docker compose ps --status running --services | grep -qx db; then bash scripts/backup.sh; fi
docker compose -f docker-compose.yml -f compose.production.yml up -d db
docker compose -f docker-compose.yml -f compose.production.yml run --rm migrate
printf '\nAPP_IMAGE=%s\n' "$image" >> .env
docker compose -f docker-compose.yml -f compose.production.yml up -d --no-build app caddy
for attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000/api/health >/dev/null; then exit 0; fi
  sleep 2
done
echo 'Health check failed. Review logs and restore previous application image; do not reverse migrations blindly.' >&2
exit 1
