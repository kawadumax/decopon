このディレクトリはフロントエンドに関するディレクトリです。
pnpm workspaceを用いてモノレポ構成となっています。
Reactを用いています。

基本的に、coreから提供されるAppコンポーネントを使ってwebおよびappをビルドする構成となっています。

## パッケージ構成
- `core`: デザインシステムと共通ロジック。`pnpm -F core build` で dist を更新し、`pnpm core:storybook` で Storybook を起動できます。
- `web`: ブラウザ向けフロントエンド。Vite + React を利用しており `pnpm web:dev` で開発サーバーが立ち上がります。
- `windows`: Tauri を用いたデスクトップアプリ。`pnpm windows:dev` で Tauri DevTools を含む開発環境が起動します。

## セットアップとコマンド
1. ルートで `pnpm install` を実行します（`package.json5` のスクリプトを参照）。
2. Web 開発: `pnpm web:dev`（`pnpm fullstack:dev` を使うと Axum バックエンドと同時起動できます）。
3. デスクトップ開発: `pnpm windows:dev`。
4. Storybook: `pnpm core:storybook`。
5. ビルド: `pnpm core:gen-routes` を実行してルート定義を最新化してから `pnpm web:build` / `pnpm windows:build` を実行してください。`pnpm build` は core をビルドした後に TypeScript プロジェクト全体をビルドします。

## 補足
- ルートの `tsconfig.paths.json` と `vite.aliases.ts` で共通のエイリアスを定義しています。
- core パッケージの `pnpm core:gen-routes` でルーティングの自動生成を行うので、ルート構成を変更した場合は再生成してください。
- バックエンドと同時に動作確認する場合は `pnpm fullstack:dev` を利用し、Axum 側の `.env` で指定したポートに合わせてください。
