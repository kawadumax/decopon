# Decopon Windows（Tauri版）

Tauri + React で構築した Windows 向けの Decopon クライアントです。バックエンド（Axum）はアプリ内 IPC で直接呼び出され、ローカルのアプリデータディレクトリに SQLite データベースや JWT シークレットを保存します。

Windows/Android などのデスクトップ・モバイルアプリで共通利用するフロントエンドのエントリーポイントや Vite 設定は `../tauri-ui` に集約しています。Windows 固有の設定は本ディレクトリにある `vite.config.ts` と `src-tauri` 以下で管理します。

## 必要な環境変数と自動設定

Windows 版では `src-tauri/src/lib.rs` 内のセットアップ処理で以下の環境変数を自動注入します。

- `AXUM_DATABASE_URL`: アプリデータディレクトリ直下の `decopon.sqlite` を指す SQLite DSN。
- `AXUM_JWT_SECRET`: `AppData\\Roaming\\com.decopon.windows\\jwt_secret` に保存された値を読み込みます。ファイルが存在しない場合は 64 文字のランダム文字列を生成して保存します。
- `APP_MODE`: ローカルクライアントとして動作させるため `local` をセットします。
- `APP_SINGLE_USER_MODE`: 単一ユーザー前提の動作をさせるため `1` をセットします。
- `APP_SINGLE_USER_EMAIL`: 単一ユーザー用のメールアドレスとして `single-user@localhost` をセットします。
- `APP_SINGLE_USER_PASSWORD`: ローカル用の既定パスワードとして `decopon-local-password` をセットします。
- `APP_SINGLE_USER_NAME`: 既定の表示名として `Decopon User` をセットします。
- `APP_SINGLE_USER_LOCALE`: 既定のロケールとして `en` をセットします。
- `APP_SINGLE_USER_WORK_TIME`: ポモドーロの作業時間として `25` をセットします。
- `APP_SINGLE_USER_BREAK_TIME`: ポモドーロの休憩時間として `5` をセットします。

SMTP を利用する場合や単一ユーザーモードを解除したい場合は、Tauri アプリを起動する前に任意の値を環境変数へ設定してください。

なお、`DATABASE_URL`、`AXUM_DISABLE_SMTP`、`AXUM_IP` / `AXUM_PORT` / `AXUM_ALLOWED_ORIGINS` などは自動では注入されません。必要に応じて `.env.windows` などのファイルやシステム環境変数で個別に設定してください（Axum 側には未設定時のフォールバック値が用意されています）。

## 開発・ビルド手順

1. リポジトリのルートで `pnpm install` を実行し依存関係を揃えます。
2. ルートで `pnpm core:gen-routes` を実行しルーティング定義を更新します。
3. 開発モードで起動する場合は `pnpm windows:dev` を実行します。Vite のフロントエンドと Tauri が起動し、IPC 経由でサービス層を利用します。
4. インストーラーを含むビルドを作成する場合は `pnpm windows:build` を実行します。`src-tauri/target/release/bundle/` 以下に MSI などのパッケージが生成されます。

バックエンドの `.env` を手動で用意する必要はありませんが、SMTP を有効化したい場合は `.env` やシステム環境変数で `AXUM_SMTP_SERVER` / `AXUM_SMTP_USERNAME` / `AXUM_SMTP_PASSWORD` などを設定してください。

## ローカル配布のポイント

- 初回起動時にアプリデータディレクトリ（例: `%APPDATA%\\com.decopon.windows`）が作成され、データベース・JWT シークレット・ログなどが格納されます。
- ルート直下の `.env.windows` で `APP_MODE=local`（および必要なら `AXUM_DISABLE_SMTP=1`）を設定すると、サーバー単体で起動した場合でもデスクトップアプリ同様の挙動になります。
- メール機能が無効な状態でもサーバーは起動し、認証ルートではメール送信をスキップして処理が継続されます。

## 推奨ツールチェーン

- [VS Code](https://code.visualstudio.com/) + [Tauri 拡張](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- Rust toolchain（stable）および Node.js (推奨: 18 以降)
- `pnpm`（リポジトリ全体で使用）

## 初回起動と再初期化（Danger Zone）

- 初期化フラグと状態表示
  - アプリデータディレクトリに `init_state.json` を作成し、初期化済みかどうかと最終バージョンを保持します。
  - プロフィール画面の最下部に「Danger Zone (Tauri)」カードを追加しました。`get_init_status` コマンドを経由して初期化状態・データディレクトリを表示し、同じ画面から再初期化を実行できます（Android 版も同一 UI）。
- シングルユーザー初期化の挙動
  - `APP_MODE=local`（Tauri ローカルビルド）の場合は既存ユーザーを上書きせず、Danger Zone でデータを削除したときのみ初期状態に戻ります。
  - `APP_MODE=web`（サーバー/デモ環境）では従来通り `.env` 由来のプロフィールで毎回上書きされます。
- 再初期化（データリセット）
  - `reset_application_data` コマンドは以下を削除します。
    - `decopon.sqlite` / `decopon.sqlite-wal` / `decopon.sqlite-shm`
    - `jwt_secret`
    - `init_state.json`
  - コマンド実行後は手動でアプリを終了・再起動し、初期ブートストラップを再度走らせてください。
