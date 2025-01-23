#!/usr/bin/env bash
echo "Running composer"
# composer2からは必要ないみたいです。
# composer global require hirak/prestissimo
composer install --no-dev --working-dir=/var/www/html
echo "Caching config..."
php artisan config:cache
echo "Caching routes..."
php artisan route:cache
echo "Running npm install..."
npm install
echo "Running npm build..."
npm run build
echo "Running migrations..."
php artisan migrate --force