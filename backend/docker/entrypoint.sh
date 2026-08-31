#!/usr/bin/env sh
set -e

cd /var/www/html

# Fresh-clone bootstrap: create .env from the V2 template if missing.
if [ ! -f .env ]; then
    echo "[backend] creating .env from .env.example"
    cp .env.example .env
fi

# Generate APP_KEY when the .env has an empty one.
if ! grep -qE '^APP_KEY=.+' .env; then
    echo "[backend] generating APP_KEY"
    php artisan key:generate --force --ansi
fi

# Install/refresh vendor only when it is missing or out of date.
# A stamp file inside the vendor volume records the composer.lock hash from
# the last completed install, so ordinary container restarts do not reinstall
# dependencies. A changed lock file (dependency change) triggers a reinstall
# on the next start.
stamp=/var/www/html/vendor/.sb-deps.sha256
needs_install=false

if [ ! -f vendor/autoload.php ]; then
    needs_install=true
elif [ ! -f "$stamp" ]; then
    needs_install=true
elif [ "$(cat "$stamp" 2>/dev/null)" != "$(sha256sum composer.lock 2>/dev/null | cut -d' ' -f1)" ]; then
    needs_install=true
fi

if [ "$needs_install" = true ]; then
    echo "[backend] running composer install"
    composer install --no-interaction --prefer-dist --no-progress
    sha256sum composer.lock | cut -d' ' -f1 > "$stamp"
fi

# Apply stock Laravel framework migrations so the app can boot against MySQL.
echo "[backend] running migrations"
php artisan migrate --force --no-interaction

exec "$@"