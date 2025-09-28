# IPC サービス層アーキテクチャと運用ガイド

## 目的

Axum ベースのサービス層を Tauri IPC からも利用できるよう再構築した結果、Decopon のフロントエンドは Web/デスクトップ/モバイル
で同一のドメインロジックを共有できるようになった。本ガイドは、新しい IPC レイヤーの構造と利用手順、開発・運用時の注意点をチーム
全体で共有することを目的とする。

## 全体像

```
┌─────────────────────────┐
│         frontend (React + Vite)          │
│ ┌─────────────┐   ┌────────────────────┐ │
│ │ core (UI/logic) │←→│ shared transport API │ │
│ └─────────────┘   └────────────────────┘ │
│         ↑ HTTP / IPC resolver            │
└─────────┬──────────────────┬────────────┘
          │                  │
   Web (fetch/Axios)   Desktop / Android (Tauri IPC)
          │                  │
┌─────────┴──────────────┬──┴─────────────────────┐
│ backend/axum services  │  frontend/app/windows  │
│ (純粋なドメインロジック)│  src-tauri ipc commands │
└─────────┬──────────────┴────────────┬─────────┘
          │                               │
         SeaORM / DB                 Runtime adapters
```

- Axum の HTTP ハンドラはサービス層を薄く呼び出すだけの形に整理済みであり、IPC 経由でも同じ API を参照する。
- `frontend/core` の API 呼び出しは `ApiTransport` 抽象を通じて HTTP/IPC を切り替え、環境に応じて最適なトランスポートを自動選択する。
- `frontend/app/windows/src-tauri` には IPC コマンドが集約され、Tauri `invoke` からサービス層を直接呼び出す。Android など追加プラットフォ
ームもここをベースに拡張する。

## 環境別の利用手順

| 環境            | 実行コマンド                         | トランスポート選択                                        | 備考 |
|-----------------|--------------------------------------|-----------------------------------------------------------|------|
| ブラウザ (Web)  | `pnpm web:dev` / `pnpm web:build`    | 既定で HTTP を利用。`VITE_APP_TRANSPORT=ipc` を指定すると IPC を強制可能だが通常は不要。 | バックエンド HTTP サーバーが別途必要。 |
| デスクトップ    | `pnpm windows:dev` / `pnpm windows:build` | IPC を優先。`VITE_APP_TRANSPORT=http` を設定すると旧サイドカー経由の HTTP も利用可。 | サイドカーは任意。IPC のみで完結する。 |
| Android (予定)  | `pnpm android:dev` (仮)              | IPC 実装を流用し、Tauri Mobile の `invoke` を利用。        | ビルドスクリプト整備後に対応。 |

- 任意で `.env` または `vite.config` 経由で `VITE_APP_TRANSPORT` を明示すると挙動を固定できる。CI やリグレッション検証時に活用する。
- サービス層が追加されたことで、HTTP/IPC 双方で同じ `AuthService`, `TaskService` などのロジックを共有する。新ユースケースはサービス層 → IPC
コマンド → フロントエンドの順で追加する。

## ビルド & セットアップ手順

1. ルートで `pnpm install` を実行し、モノレポ全体の依存を解決する。
2. バックエンドの DB マイグレーションが必要な場合は `pnpm axum:migrate` を利用する。IPC モードでも DB はサーバー内で初期化される。
3. フロントエンドは共通ルート生成のため `pnpm core:gen-routes` を先に実行する。
4. 各プラットフォームのビルドコマンド (`pnpm web:build` / `pnpm windows:build`) を呼び出す。IPC 周りのビルドは追加設定不要。
5. デスクトップ版の配布物には Axum バイナリを同梱しない。必要であれば `VITE_APP_TRANSPORT=http` とサイドカー設定を復活させて従来モードを併用する。

## テスト戦略

- **サービス層単体テスト**: `backend/axum` の `cargo test` でサービス層と HTTP ハンドラの結合を確認する。IPC からも同じサービスを利用するた
め、ここでカバーできていれば IPC 側も動作保証しやすい。
- **IPC コマンド Smoke テスト**: `frontend/app/windows/src-tauri` の `cargo test` で IPC コマンドのリクエスト/レスポンス整形を検証する。
  - Linux CI で GTK 依存が不足する場合は `tauri-driver` を利用した `cargo test --no-default-features` 構成を検討する。
- **フロントエンド統合テスト**: `pnpm test` (Vitest) で `ApiTransport` のモックを使い分け、HTTP/IPC 双方を想定したケースを追加する。
- **エンドツーエンド**: Playwright を利用し、デスクトップ版は `@tauri-apps/api` のモックを通じて IPC レイヤーをスパイする。Web 版は従来の HTTP モードで実行。

## エラーハンドリング & モニタリング

- Tauri IPC コマンドは `anyhow::Result` を `IpcError` に変換し、エラーコード (`Unauthenticated`, `ValidationFailed`, `Unknown`) とメッセージを返す。
- フロントエンド側では `ApiError` 型に正規化し、既存の Toast 通知経路 (`ToastMessageManager`) に送出する。IPC 由来の `Unknown` エラーはログ出力 (`console.error`) に加え、Sentry などのリモートロギングへ送信する。
- サービス層で `tracing` を利用し、リクエスト ID とユーザー ID をスパンに含める。Tauri コマンドから呼び出す際も同じスパンを引き継げるよう `TracingLayer` を初期化する。
- Windows/Android バイナリでは `AppData` 配下に `logs/tauri-ipc.log` を出力し、ユーザー報告時の再現調査に利用する。

## CI での IPC 検証ジョブ案

```yaml
tauri-ipc-smoke:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v2
      with:
        version: 8
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'pnpm'
    - name: Install frontend dependencies
      run: pnpm install
    - name: Install Rust toolchain
      uses: dtolnay/rust-toolchain@stable
    - name: Run service layer tests
      run: cargo test --manifest-path backend/axum/Cargo.toml
    - name: Run Tauri IPC tests (headless)
      run: |
        sudo apt-get update
        sudo apt-get install -y libgtk-3-dev webkit2gtk-4.1 libayatana-appindicator3-dev
        cargo test --manifest-path frontend/app/windows/src-tauri/Cargo.toml --no-default-features
    - name: Run transport unit tests
      run: pnpm -r test --filter core -- --runInBand
```

- GTK/WebKit 依存を事前に導入することで Linux CI でも Tauri のビルドを通せる。
- `--no-default-features` により GUI 実行を避けつつ IPC ロジックの Smoke テストを実施する。
- 将来的に Android 対応を追加した際は、同ジョブで `cargo test --target aarch64-linux-android` などのクロスコンパイル検証も検討する。

## 運用上のトラブルシューティング

- IPC 呼び出しが失敗し HTTP フォールバックが発生する場合、`VITE_APP_TRANSPORT` や `TransportResolver` のログ (`[transport]`) を確認する。
- サービス層のマイグレーションがズレた場合は `pnpm axum:migrate` を再実行し、SQLite の再生成 (`backend/database/db.sqlite` の削除) で復旧する。
- Windows でのみ失敗するケースは `logs/tauri-ipc.log` と `Event Viewer` を併用して調査する。Android 向けには Logcat に `decopon-ipc` タグを出力する予定。

## 今後の拡張

- Android ビルドパイプライン整備と、IPC コマンドのプラットフォーム別差異の整理。
- IPC コマンドのスキーマバリデーションを `schemars` + `zod` で自動生成し、フロントエンド型定義との同期を図る。
- モバイル向けエラーログ収集基盤 (Sentry Mobile / Firebase Crashlytics) の導入検討。

このドキュメントは随時更新する。改善案や追加要件があれば Issue / Pull Request で共有してほしい。
