## 必要なコマンドなど

```shell
# nodeとphp
# 略
```

## プロジェクト初期化

```shell
git clone git@github.com:kawadumax/decopon.git
cp .env.example .env # git から落としてきた後、.env をコピーする。
# just backend-run composer install # phpの依存ファイルを入れる
# just web-run pnpm install # jsの依存ファイルを入れる
```

`AXUM_ALLOWED_ORIGINS` にカンマ区切りで許可するオリジンを設定します。
例: `AXUM_ALLOWED_ORIGINS=http://localhost:5173`

DB の初期化

```shell
php artisan migrate --seed # laravel
pnpm axum:fresh # axum
```

# 暗号化キーの生成がいるかも

```shell
php artisan key:generate
```

## コマンドのメモ書き
マイクロサービス化して、ルートディレクトリにコマンドを置いておく
タスクランナとしてconcurrentlyを使ってます。

```shell
pnpm install
pnpm fullstack:dev # webとaxumの起動
```

DB リセットして Seeder 実行

```
php artisan migrate:fresh --seed # laravel
pnpm axum:fresh
```

## Git hooksのフォルダを指定
```
git config --local core.hooksPath .githooks
```

## PRメモ
- Windows 向け Tauri アプリでは `frontend/app/windows/src-tauri/src` 配下に独自の `ipc` モジュールは存在せず、共通クレート `decopon_app_ipc` をそのまま利用する実装が既に反映されている。2025年1月時点では過去のスタブ実装（`src/ipc/*.rs`）も削除済みのため、IPC コマンドの追加や修正は共通クレート側で行う。