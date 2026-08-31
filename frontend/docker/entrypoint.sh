#!/usr/bin/env sh
set -e

cd /app

# Install/refresh node_modules only when it is missing or out of date.
# A stamp file inside the node_modules volume records the package-lock.json
# hash from the last completed install, so ordinary container restarts do not
# reinstall dependencies. A changed lock file (dependency change) triggers a
# reinstall on the next start.
stamp=/app/node_modules/.sb-deps.sha256
needs_install=false

if [ ! -f node_modules/.package-lock.json ]; then
    needs_install=true
elif [ ! -f "$stamp" ]; then
    needs_install=true
elif [ -f package-lock.json ] \
    && [ "$(cat "$stamp" 2>/dev/null)" != "$(sha256sum package-lock.json 2>/dev/null | cut -d' ' -f1)" ]; then
    needs_install=true
fi

if [ "$needs_install" = true ]; then
    echo "[frontend] running npm install"
    npm install --no-audit --no-fund --loglevel=error
    if [ -f package-lock.json ]; then
        sha256sum package-lock.json | cut -d' ' -f1 > "$stamp"
    fi
fi

exec "$@"