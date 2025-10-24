# Decopon Android（Tauri版）

Tauri + React で構築した Android 向けの Decopon クライアントです。Windows 版と同じくバックエンド（Axum）をアプリ内 IPC で直接呼び出し、アプリデータディレクトリに SQLite データベースや JWT シークレットを配置します。

フロントエンドのエントリーポイントや Vite 設定は `../shared` に集約されており、Android 固有の設定は本ディレクトリの `vite.config.ts` と `src-tauri` 以下で管理します。

## 開発環境の準備

1. ルートで `pnpm install`、`pnpm core:gen-routes`、`pnpm -F core build` を実行し共通依存を揃えます。
2. Android SDK / NDK、Java 17、Android Studio（またはコマンドラインツール）を用意し、`ANDROID_HOME`・`JAVA_HOME`・`NDK_HOME` などの環境変数を設定します。
3. `pnpm -F @decopon/app-android tauri android prerequisites` を実行してツールチェーンを検証します。

## 開発・ビルド手順

- 開発モード: `pnpm android:dev`
- ビルド（APK/AAB）: `pnpm android:build`

実機またはエミュレータでテストする場合、Vite 開発サーバーが LAN 越しに到達できるよう `TAURI_DEV_HOST` を端末から到達可能なホスト名・IP に設定してください。設定しない場合は `0.0.0.0` で待ち受けます。

## 環境変数の自動設定

`src-tauri/src/lib.rs` の初期化処理で、以下の環境変数を自動で補完します。必要に応じて Tauri アプリ起動前に上書きしてください。

- `AXUM_DATABASE_URL`: アプリデータディレクトリ配下の `decopon.sqlite` を指す SQLite DSN。
- `AXUM_JWT_SECRET`: ディレクトリ内の `jwt_secret` ファイルから読み込み、なければ 64 文字のランダム文字列を生成して保存します。
- `APP_SINGLE_USER_MODE`: 単一ユーザー前提で動作させるため `1` をセットします。
- `APP_SINGLE_USER_EMAIL` / `APP_SINGLE_USER_PASSWORD` / `APP_SINGLE_USER_NAME` / `APP_SINGLE_USER_LOCALE` / `APP_SINGLE_USER_WORK_TIME` / `APP_SINGLE_USER_BREAK_TIME`: モバイル単体でも利用できる既定値を注入します。

SMTP を利用する場合や単一ユーザーモードを解除したい場合は、適宜環境変数を明示的に設定してください。
