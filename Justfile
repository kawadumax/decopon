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
    just backend &
    just web
    wait