# Decopon Android（Tauri版）

Tauri + React で構築した Android 向けの Decopon クライアントです。Windows 版と同じくバックエンド（Axum）をアプリ内 IPC で直接呼び出し、アプリデータディレクトリに SQLite データベースや JWT シークレットを配置します。

フロントエンドのエントリーポイントや Vite 設定は `../tauri-ui` に集約されており、Android 固有の設定は本ディレクトリの `vite.config.ts` と `src-tauri` 以下で管理します。

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
- `APP_MODE`: ローカルクライアントとして動作させるため `local` をセットします。
- `APP_SINGLE_USER_MODE`: 単一ユーザー前提で動作させるため `1` をセットします。
- `APP_SINGLE_USER_EMAIL` / `APP_SINGLE_USER_PASSWORD` / `APP_SINGLE_USER_NAME` / `APP_SINGLE_USER_LOCALE` / `APP_SINGLE_USER_WORK_TIME` / `APP_SINGLE_USER_BREAK_TIME`: モバイル単体でも利用できる既定値を注入します。

SMTP を利用する場合や単一ユーザーモードを解除したい場合は、適宜環境変数を明示的に設定してください。

## 初回起動と Danger Zone

- アプリデータディレクトリ配下に `init_state.json` を作成し、初期化済みフラグと最終バージョンを保持します。
- プロフィール画面最下部に「Danger Zone (Tauri)」を表示しており、`get_init_status` / `reset_application_data` コマンド経由で状態確認と再初期化が可能です（Windows 版と同じ UI）。
- `APP_MODE=local` では既存ユーザーを再生成せず、Danger Zone の「ローカルデータ削除」実行時のみデータベースを作り直します。`APP_MODE=web` を指定したサーバー起動時は従来通り `.env` 由来の値で上書きされます。
- `reset_application_data` は `decopon.sqlite*` / `jwt_secret` / `init_state.json` を削除します。実行後はアプリを明示的に終了し、再起動してブートストラップをやり直してください。

## 謎の接続エラーについて

Windows機で、Android Emulatorから開発版ビルドのviteサーバーにどうやってもアクセスできなかった。
`frontend\app\android\src-tauri\tauri.conf.json`における下記の設定によってなぜか解決した。

```
    "windows": [
      {
        "additionalBrowserArgs": "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --autoplay-policy=no-user-gesture-required"
      }
    ]
```

本来この設定はWindows版デスクトップの設定で読み込まれるため、関係ないはずだが、これを無くすと動かない。注意。

## ネイティブプロジェクトと署名設定

`src-tauri/gen/android` 直下の Gradle プロジェクトをリポジトリで管理するようにしました。リリース署名の設定も `app/build.gradle.kts` に常駐させているため、むやみに `gen/android` を削除しないでください。

- 署名に必要な情報は `src-tauri/gen/android/keystore.properties`（ローカル専用、gitignore 済み）か、以下の環境変数から解決されます。  
  `TAURI_ANDROID_KEYSTORE_PATH` / `TAURI_ANDROID_KEYSTORE_PASSWORD` / `TAURI_ANDROID_KEY_PASSWORD` / `TAURI_ANDROID_KEY_ALIAS`
- ローカルで `keystore.properties` を使う場合は以下のように記述します（パスやパスワードは各自のものに差し替えてください）。

  ```
  storeFile=D:/path/to/release.jks
  storePassword=********
  keyAlias=app-release
  keyPassword=********
  ```

- GitHub Actions (`.github/workflows/release.yml`) では上記の環境変数を Secrets から注入しています。`pnpm android:build` を実行すると、自動的に署名済み APK が生成されます。
- どうしてもプロジェクトを再生成する必要がある場合のみ、`pnpm -F @decopon/app-android tauri android init --ci` を実行してください。その際は必ず下記のファイルを一時退避し、生成後に戻してからコミットしてください。
  - `src-tauri/gen/android/app/build.gradle.kts`（署名設定・依存関係のカスタマイズを保持）
  - そのほか手動で加えた変更があるファイル
  - `keystore.properties`（追跡されませんが、ローカルで再利用する場合はバックアップしておくと安全です）

## 開発時、役に立つ作法

`pnpm android:halt` というコマンドを用意しています。これはadbとemulatorの常駐プロセスを全て切るものです。
また、よく使うコマンドを記載しておきます。

`adb emu kill` 起動しているエミュレータを消す
`adb devices` adbが接続しているエミュレータの一覧を出す。起動してるのにオフラインとか普通にある。
`adb reverse` エミュレータからホスト側にアクセスするときのポートを接続するコマンド
