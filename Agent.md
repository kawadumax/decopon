# Decopon Monorepo ガイド

このリポジトリはタスクマネジメントアプリ「Decopon」のモノレポです。pnpm のワークスペースでフロントエンドとバックエンド、開発用スクリプトを一元管理しています。

## 全体構成
- `frontend`: React + Vite を用いたクライアント群。`core` パッケージが UI/ルーティングの中核を担い、`web` と `windows` がそれぞれブラウザと Tauri 向けエントリーポイントです。
- `backend`: Rust（Axum）による API サーバーと、参考用に保持している Laravel プロジェクトを格納しています。Axum のセットアップやマイグレーションは `backend/axum/Agent.md` を参照してください。
- `documents`: 製品概要やモックなどの資料を収集しています。
- `scripts`: pnpm スクリプトや CI を補助するユーティリティを配置しています。

## 開発フローの概要
1. ルートで `pnpm install` を実行して依存関係をセットアップします。
2. フロントエンド開発は `pnpm web:dev`、デスクトップ版は `pnpm windows:dev` を利用します。
3. バックエンドの開発サーバーは `pnpm axum:dev`（または `cargo run`）で起動できます。`pnpm fullstack:dev` でフロントエンドと同時起動も可能です。
4. フロントエンドをビルドする際は必ず事前に `pnpm core:gen-routes` を実行してルート情報を最新化してください。

## 補足情報
- ルートの `package.json5` に全ワークスペース共通のスクリプトが定義されています。`pnpm -r run <script>` でパッケージ横断のコマンドを実行できます。
- TypeScript 設定は `tsconfig.base.json` / `tsconfig.build.json` で共有し、フロントエンド固有のパスエイリアスは `frontend/tsconfig.paths.json` にまとめています。
- 開発用 SQLite データベースは `backend/database/db.sqlite` に配置されます。必要に応じて削除・再生成してください。
