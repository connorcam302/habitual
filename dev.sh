#!/usr/bin/env bash
set -e

docker compose up -d db

trap 'kill $(jobs -p) 2>/dev/null' EXIT

# Load local API env (DATABASE_URL, ANTHROPIC_API_KEY, etc.)
if [ -f api/.env ]; then
  set -a; source api/.env; set +a
else
  echo "Warning: api/.env not found — copy api/.env.example and fill in your keys"
fi

node --watch api/server.js &

cd frontend && npm run dev
