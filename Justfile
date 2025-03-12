# バックエンドのディレクトリ
BACKEND_DIR := 'backend'

# フロントエンドのディレクトリ
FRONTEND_DIR := 'frontend'

# フロントエンドのWebディレクトリ
FRONTEND_WEB_DIR := 'frontend/web'

# バックエンドの起動
backend:
    cd {{BACKEND_DIR}} && php artisan serve

# フロントエンドの起動
web:
    cd {{FRONTEND_WEB_DIR}} && pnpm run dev

# バックエンドとフロントエンドの同時起動
all:
    #!/bin/bash -eux
    (stdbuf -oL just backend | sed "s/^/$(printf '\033[32m[BACKEND]\033[0m ')/") &
    (stdbuf -oL just web | sed "s/^/$(printf '\033[34m[FRONTEND]\033[0m ')/") &
    trap 'kill $(jobs -pr)' EXIT
    wait