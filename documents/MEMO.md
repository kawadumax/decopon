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

## Cargo ローカル設定（開発用高速化）

- CI/リリースは `.cargo/config.toml` の stable 設定のみを参照します（不安定機能なし、追加 rustflags なし）。
- 開発で Cranelift を使ってビルドを速くしたい場合（＋ Zerocopy のワークアラウンドを有効化したい場合）は、nightly を導入した上で以下を実行してください。

```shell
cp .cargo/config.local.example.toml .cargo/config.local.toml
```

- `.cargo/config.local.toml` は `.gitignore` 済みで、CI には影響しません。`config.local` に含まれるのは Cranelift 用の `codegen-backend` 設定と Zerocopy/Cranelift ワークアラウンド用の `rustflags` です。

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
