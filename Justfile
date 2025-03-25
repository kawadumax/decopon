# バックエンドのディレクトリ
BACKEND_DIR := 'backend'

# フロントエンドのディレクトリ
FRONTEND_DIR := 'frontend'

# フロントエンドのWebディレクトリ
FRONTEND_WEB_DIR := 'frontend/web'

# バックエンドの起動
backend:
    cd {{BACKEND_DIR}} && php artisan serve

backend-run *args:
    cd {{BACKEND_DIR}} && {{ args }}

pail:
    cd {{BACKEND_DIR}} && php artisan pail --timeout=60

queue:
    cd {{BACKEND_DIR}} && php artisan queue:listen --tries=1

ziggy:
    cd {{BACKEND_DIR}} && php artisan ziggy:generate

route:
    cd {{BACKEND_DIR}} && php artisan route:list

fresh:
    cd {{BACKEND_DIR}} && php artisan migrate:fresh --seed

# フロントエンドの起動
web:
    cd {{FRONTEND_WEB_DIR}} && pnpm run dev

web-run *args:
    cd {{FRONTEND_WEB_DIR}} && {{ args }}

# バックエンドとフロントエンドの同時起動
all:
    #!/bin/bash -eu
    just ziggy
    (stdbuf -oL just backend | sed "s/^/$(printf '\033[32m[BACKEND]\033[0m ')/") &
    (stdbuf -oL just pail | sed "s/^/$(printf '\033[31m[PAIL]\033[0m ')/") &
    (stdbuf -oL just queue | sed "s/^/$(printf '\033[35m[QUEUE]\033[0m ')/") &
    (stdbuf -oL just web | sed "s/^/$(printf '\033[34m[FRONTEND]\033[0m ')/") &
    trap 'kill $(jobs -pr)' EXIT
    wait