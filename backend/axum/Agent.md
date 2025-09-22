このディレクトリはAxumで構築したバックエンドサービスを管理します。
Rust（Cargo workspace）を用いており、`migration` クレートとアプリケーション本体が同一リポジトリで管理されています。

## 環境構築
1. Rust ツールチェーン（stable）と `cargo` を準備します。
2. `.env.example` を `.env` にコピーし、ポートや JWT シークレット、SMTP などの値を調整してください。
3. 開発サーバーはルートから `pnpm axum:dev`、もしくはこのディレクトリで `cargo run` で起動します。
4. 型・ビルド確認は `cargo check`、テストは `cargo test` を使用します。

## データベースとマイグレーション
- デフォルトでは `backend/database/db.sqlite` の SQLite を SeaORM 経由で参照します。`AXUM_DATABASE_URL` を変更すると別の DSN を利用できます。
- マイグレーション関連コマンド
  - `cargo run -p migration -- generate MIGRATION_NAME`: 新しいマイグレーションファイルを追加
  - `cargo run -p migration -- fresh`: 既存マイグレーションを適用（必要に応じて `-u` で DSN を指定）
- エンティティは `sea-orm-cli generate entity -o src/entities` で再生成できます。

## 開発時の留意事項
- API は既定で `127.0.0.1:3000` で待ち受け、`.env` の `AXUM_ALLOWED_ORIGINS` で CORS 許可先を制御します。
- `pnpm fullstack:dev` を使うとフロントエンド (`web`) と同時に起動でき、`.env` で指定したポートに合わせて動作確認できます。
- ログ出力は `RUST_LOG` 環境変数に従います（例: `RUST_LOG="info,decopon_axum=trace"`）。
- `APP_SINGLE_USER_MODE=true` とするとシングルユーザーモードが有効になり、バックエンド起動時に固定アカウントを整備して `/auth/local/session` から JWT とプロフィールを取得できます。
