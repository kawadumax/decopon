# Windows IPC 移行検証レポート

## 背景

Windows 版 Decopon では従来、Axum バックエンドをサイドカーとして同梱し、Tauri から HTTP 越しに API を利用していました。サービス
層が IPC 化されたことを受け、Windows ビルドでもサイドカーを必須としない構成へ移行します。

## 実施内容

- `src-tauri/tauri.conf.json` からサイドカー定義を削除し、既定ビルドでは Axum バイナリをバンドルしないよう変更。
- `src-tauri/build.rs` からサイドカーのビルド処理を削除し、IPC 前提の構成に一本化。
- README を更新し、IPC モード前提の手順と環境構成に整理。

## サイドカーなしビルド手順

1. ルートで `pnpm install` を実行して依存関係を揃えます。
2. `pnpm windows:dev` または `pnpm windows:build` をそのまま実行します。追加の環境変数設定は不要で、IPC 経由でサービス層が利用されます。
3. 初回起動時に `AppData\\Roaming\\com.decopon.windows`（開発環境では `AppData` 相当のディレクトリ）が作成され、SQLite データベー
   スおよび JWT シークレットが生成されます。

## 検証状況

- Linux 環境で `pnpm -F @decopon/app-windows tauri info` を実行し、IPC モードの設定が読み込まれることを確認（`webkit2gtk` などのシ
  ステムライブラリは未インストールのため警告が表示されます）。
- `cargo test --manifest-path frontend/app/windows/src-tauri/Cargo.toml` を試行。`glib-2.0` などの GTK 系ライブラリがコンテナに存在
  しないためビルドが失敗しました（Tauri の Linux 前提依存が不足）。CI やローカルで必要パッケージを導入した上での再実行を推奨します。

Windows 実機でのバイナリ起動は今後の CI/CD 上で追加検証予定です。
