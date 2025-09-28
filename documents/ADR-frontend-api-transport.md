# ADR: IPC/HTTP 共通 API クライアントの設計

## 背景

デスクトップ版 (Tauri) と Web 版を同一のフロントエンドロジックで共有するため、API 呼び出しレイヤーを HTTP と IPC の 2 系統で切り替えられる構造に再設計する必要があった。従来は Axios を直接呼び出す `callApi` のみが存在し、IPC 経由でバックエンドサービスを利用する場合にロジックを二重実装する課題があった。

## 決定

- `frontend/core/src/scripts/api/client` 配下に API クライアントを再構成し、`ApiTransport` インターフェイスで HTTP/IPC の実装差異を吸収する。
- `callApi` は `TransportResolver` を経由して実行可能なトランスポートを選択する。IPC が利用可能な環境 (`window.__TAURI__?.core?.invoke` が存在し、かつ `VITE_APP_TRANSPORT` で HTTP 強制が指定されていない場合) では IPC を優先し、未対応リクエストは HTTP にフォールバックする。
- HTTP トランスポートは既存の Axios ラッパーを再利用し、インターセプターによるトークン付与・401 ハンドリングを維持する。
- IPC トランスポートは Tauri コマンド (`login`, `list_tasks`, `create_task`, `update_task`, `delete_task`) に変換するルーティングテーブルを持ち、レスポンスを既存のドメイン型 (`AuthResponse`, `Task`, `Tag`) に正規化する。
- IPC コマンド未対応の API については自動的に HTTP 実装へフォールバックすることで、段階的な IPC 移行を可能にする。
- エラーは共通の `ApiError` 型に正規化し、従来の Axios エラーと同様に `ToastMessageManager` へ通知する。IPC で 401 が発生した場合もトークン/キャッシュ削除とルーター遷移を行う。

## 影響

- `frontend/core` から `callApi` を利用するコードは import 先を変更することなく HTTP/IPC 両対応となった。
- IPC ルート追加時は `ipc.ts` のルーティングと変換ロジックを拡張するだけで良い。
- `VITE_APP_TRANSPORT=http` を指定すると強制的に HTTP のみを使用するため、開発・デバッグ時に従来挙動へ切り替え可能。
- エラー通知は従来同様に Toast を通じて行われ、`axios` 由来のエラーを明示的に識別する既存コードも動作を維持する。

## 今後の課題

- IPC 経由で利用可能なユースケースの拡充 (プロフィール更新、タグ管理など)。
- Android 版など Tauri 以外の IPC 実装が必要になった際のトランスポート追加。
- IPC 側でのエラーメタデータ拡充と、フロントエンドでのローカライズ対応。
