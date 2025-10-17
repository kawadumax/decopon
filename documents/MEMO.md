## 必要なコマンドなど

```shell
# Node.js (pnpm)
# Rust (cargo)
```

## プロジェクト初期化

```shell
git clone git@github.com:kawadumax/decopon.git
cp .env.example .env # git から落としてきた後、.env をコピーする。
pnpm install # フロントエンドおよびワークスペース全体の依存をインストール
```

`AXUM_ALLOWED_ORIGINS` にカンマ区切りで許可するオリジンを設定します。
例: `AXUM_ALLOWED_ORIGINS=http://localhost:5173`

DB の初期化

```shell
pnpm axum:fresh # axum
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
pnpm axum:fresh
```

## Git hooksのフォルダを指定
```
git config --local core.hooksPath .githooks
```
