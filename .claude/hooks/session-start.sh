#!/bin/bash
# SessionStart hook: install dependencies and provision a local MongoDB so the
# full stack (backend API + seeded data + frontend) can run in web sessions.
set -euo pipefail

# Only run setup in the remote (Claude Code on the web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Run setup in the background so the session starts without waiting.
echo '{"async": true, "asyncTimeout": 300000}'

cd "$CLAUDE_PROJECT_DIR"

echo "[session-start] Installing backend dependencies..."
npm install

echo "[session-start] Installing frontend dependencies..."
(cd frontend && npm install)

# Persist environment defaults for the session. The frontend hardcodes the API
# at :5001, and the backend reads MONGODB_URI / PORT / JWT_SECRET from env.
{
  echo "export PORT=5001"
  echo "export NODE_ENV=development"
  echo "export JWT_SECRET=dev_session_secret"
  echo "export JWT_EXPIRE=7d"
  echo "export MONGODB_URI=mongodb://127.0.0.1:27017/tutor-match"
} >> "$CLAUDE_ENV_FILE"

# --- Provision a local MongoDB (best-effort, never fails the hook) ---
# Needs either a system `mongod`, or network access to MongoDB's binary CDN so
# mongodb-memory-server-core can fetch one. If neither is available (e.g. a
# restrictive network policy), the hook still succeeds; the backend just won't
# connect until a MongoDB is reachable.
provision_mongo() {
  local DBPATH="$CLAUDE_PROJECT_DIR/.mongo-data"
  local LOGPATH="$DBPATH/mongod.log"
  mkdir -p "$DBPATH"

  local MONGOD_BIN=""
  if command -v mongod >/dev/null 2>&1; then
    MONGOD_BIN="$(command -v mongod)"
  else
    echo "[session-start] Resolving mongod binary (mongodb-memory-server-core)..."
    MONGOD_BIN="$(MONGOMS_VERSION="${MONGOMS_VERSION:-7.0.14}" MONGOMS_DISTRO="${MONGOMS_DISTRO:-ubuntu-22.04}" node ./scripts/resolve-mongod.mjs)" || return 1
  fi
  [ -n "$MONGOD_BIN" ] || return 1

  # Already running from a cached container layer? Reuse it.
  if node -e "const n=require('net');const s=n.connect(27017,'127.0.0.1',()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1))" 2>/dev/null; then
    echo "[session-start] mongod already listening on 27017."
  else
    echo "[session-start] Starting mongod ($MONGOD_BIN) on 27017..."
    "$MONGOD_BIN" --dbpath "$DBPATH" --port 27017 --fork --logpath "$LOGPATH" >/dev/null
  fi

  echo "[session-start] Seeding database..."
  MONGODB_URI="mongodb://127.0.0.1:27017/tutor-match" npm run seed:fresh
}

if provision_mongo; then
  echo "[session-start] MongoDB ready and seeded."
else
  echo "[session-start] WARNING: could not provision MongoDB. The network policy may block MongoDB's binary CDN and no system mongod is installed. Dependencies are installed, but the backend will not connect until a MongoDB is available." >&2
fi

echo "[session-start] Setup complete."
