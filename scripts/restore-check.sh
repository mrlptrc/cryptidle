#!/usr/bin/env bash
# Restores to a separate disposable database; never overwrites gameplay data.
set -euo pipefail
cd "$(dirname "$0")/.."
file="${1:?Usage: bash scripts/restore-check.sh backups/file.dump}"
test -f "$file"
database="restore_check_$(date +%s)_$$"
docker compose exec -T db createdb -U cryptidle "$database"
trap 'docker compose exec -T db dropdb -U cryptidle "$database"' EXIT
docker compose exec -T db pg_restore -U cryptidle -d "$database" --exit-on-error --no-owner < "$file"
docker compose exec -T db psql -U cryptidle -d "$database" -v ON_ERROR_STOP=1 -c 'SELECT COUNT(*) AS migration_count FROM _prisma_migrations;'
printf 'Restore succeeded in isolated database %s\n' "$database"
