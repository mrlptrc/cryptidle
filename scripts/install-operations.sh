#!/usr/bin/env bash
set -euo pipefail
cd /opt/cryptidle
install -m 644 infra/cryptidle-backup.service /etc/systemd/system/
install -m 644 infra/cryptidle-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now cryptidle-backup.timer
