# Decopon App エントリーポイント

`frontend/app` は Tauri を利用するデスクトップアプリや、将来的に予定しているモバイルアプリ（Android 版など）の共通コードをまとめる領域です。

- `shared`: React + Vite のエントリーポイントを管理します。`src` 以下にアプリ本体を配置し、`index.html` や TypeScript 設定もここで共有します。
- `windows`: Windows 向けの Tauri プロジェクトです。`vite.config.ts` で `shared` のエントリーポイントを取り込み、`src-tauri` 以下でプラットフォーム固有の設定・サイドカーを保持します。

将来的に Android 版を追加する際は、`frontend/app/android` のようなディレクトリを追加し、`shared` を参照する構成にすることで UI ロジックやビルド設定の重複を抑えられます。
