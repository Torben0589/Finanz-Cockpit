#!/usr/bin/env bash
# =====================================================================
# First-time setup on the Raspberry Pi 5.
# Run this ONCE after cloning the repo (or copying just deploy/pi/)
# onto the Pi. It never touches GitHub — it only prepares local,
# machine-specific files that must NEVER be committed.
# =====================================================================
set -euo pipefail

cd "$(dirname "$0")"

if [ -f .env ]; then
  echo "⚠️  .env already exists — leaving it untouched."
else
  cp .env.pi.example .env
  SECRET=$(openssl rand -hex 32)
  # Portable sed for both GNU (Linux/Pi) and BSD (macOS) sed
  sed -i.bak "s/REPLACE_ME_WITH_RANDOM_64_CHAR_HEX/${SECRET}/" .env && rm -f .env.bak
  echo "✅ Generated .env with a fresh random SESSION_SECRET."
fi

mkdir -p data
echo "✅ ./data directory ready for the SQLite database."

read -rp "GHCR image path (e.g. ghcr.io/yourname/finance-cockpit:latest): " IMAGE
if [ -n "$IMAGE" ]; then
  sed -i.bak "s#ghcr.io/OWNER/REPO:latest#${IMAGE}#" docker-compose.yml && rm -f docker-compose.yml.bak
  echo "✅ docker-compose.yml now points at ${IMAGE}."
fi

echo ""
echo "Next steps:"
echo "  docker compose pull"
echo "  docker compose up -d"
echo ""
echo "Then open http://<pi-ip>:3000 and complete the /setup wizard."
