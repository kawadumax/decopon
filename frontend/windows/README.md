# Decopon Windows（Tauri版）

Tauri + React で構築した Windows 向けの Decopon クライアントです。バックエンド（Axum）はサイドカーとして同梱され、ローカルのアプリデータディレクトリに SQLite データベースや JWT シークレットを保存します。

## 必要な環境変数と自動設定

Windows 版では `src-tauri/src/lib.rs` 内のセットアップ処理で以下の環境変数を自動注入します。

- `AXUM_DATABASE_URL` / `DATABASE_URL`: アプリデータディレクトリ直下の `decopon.sqlite` を指す SQLite DSN。
- `AXUM_JWT_SECRET`: `AppData\Roaming\com.decopon.windows\jwt_secret` に保存された値を読み込みます。ファイルが存在しない場合は 64 文字のランダム文字列を生成して保存します。
- `APP_SINGLE_USER_MODE`: 単一ユーザー前提の動作をさせるため `1` をセットします。
- `AXUM_DISABLE_SMTP`: ローカル配布でメール送信を行わないため `1` をセットします。
- `AXUM_IP` / `AXUM_PORT` / `AXUM_ALLOWED_ORIGINS`: 未設定時にローカル開発向けの既定値を補います。

SMTP を利用する場合や単一ユーザーモードを解除したい場合は、Tauri アプリを起動する前に任意の値を環境変数へ設定してください。

## 開発・ビルド手順

1. リポジトリのルートで `pnpm install` を実行し依存関係を揃えます。
2. ルートで `pnpm core:gen-routes` を実行しルーティング定義を更新します。
3. 開発モードで起動する場合は `pnpm windows:dev` を実行します。Vite のフロントエンドと Tauri のサイドカーが同時に起動します。
4. インストーラーを含むビルドを作成する場合は `pnpm windows:build` を実行します。`src-tauri/target/release/bundle/` 以下に MSI などのパッケージが生成されます。

バックエンドの `.env` を手動で用意する必要はありませんが、SMTP を有効化したい場合は `.env` やシステム環境変数で `AXUM_SMTP_SERVER` / `AXUM_SMTP_USERNAME` / `AXUM_SMTP_PASSWORD` などを設定してください。

## ローカル配布のポイント

- 初回起動時にアプリデータディレクトリ（例: `%APPDATA%\com.decopon.windows`）が作成され、データベース・JWT シークレット・ログなどが格納されます。
- `.env.example` にある `APP_SINGLE_USER_MODE` と `AXUM_DISABLE_SMTP` を `1` に設定すると、サーバー単体で起動した場合でもデスクトップアプリ同様の挙動になります。
- メール機能が無効な状態でもサーバーは起動し、認証ルートではメール送信をスキップして処理が継続されます。

## 推奨ツールチェーン

- [VS Code](https://code.visualstudio.com/) + [Tauri 拡張](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- Rust toolchain（stable）および Node.js (推奨: 18 以降)
- `pnpm`（リポジトリ全体で使用）
