# Experimental Area

このディレクトリには、Decopon のフロントエンドを将来的にどう進化させるかを検証するための試作コードをまとめています。本番の React 実装と切り離された状態で検証できるよう、各実験は独立した構成にしています。

## Dioxus プロトタイプ

- 配置パス: `experimental/dioxus`
- 使用スタック: Rust + [Dioxus](https://dioxuslabs.com/) デスクトップレンダラー (Wry)
- 目的: React ではなくネイティブレンダラーでタスク管理 UI を構築した際の体験を評価すること。

### 使い方

```bash
cd experimental/dioxus
cargo run
```

初回起動時は Dioxus まわりの依存関係を取得し、カウンター UI を表示するネイティブウィンドウが立ち上がります。ホットリロードは標準では有効化していないため、`cargo watch -x run` などを組み合わせて素早く反復してください。

### 開発メモ

- Rust 1.86（バックエンドと同じバージョン）に合わせるため、Dioxus は 0.5 系に固定しています。ワークスペースで Rust のバージョンが上がったら適宜追従してください。
- `tracing_subscriber` を組み込んでいるので、`RUST_LOG=debug cargo run` のように指定すると追加のログを確認できます。
- 実験コードがリリース成果物に混ざらないよう、クレートには `publish = false` を設定し、プロダクションのワークスペース外に配置しています。
