#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
mkdir -p backups
file="backups/cryptidle-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T db pg_dump -U cryptidle -d cryptidle -Fc > "$file.tmp"
mv "$file.tmp" "$file"
docker compose exec -T db pg_restore --list < "$file" >/dev/null
if [[ -n "${BACKUP_BUCKET:-}" ]]; then aws s3 cp "$file" "s3://${BACKUP_BUCKET}/database/$(basename "$file")" --only-show-errors; fi
find backups -maxdepth 1 -type f -name 'cryptidle-*.dump' -mtime +7 -delete
printf '%s\n' "$file"
