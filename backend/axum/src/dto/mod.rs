//! HTTP の境界 (リクエスト/レスポンス) で JSON にシリアライズ/デシリアライズする型を集約するモジュール。
//! これらの型はハンドラ層での入出力専用として利用し、`Request`/`Response` など HTTP 依存の
//! 命名を採用しています。一方、サービス層で扱う `NewTask` や `Task`、`User` などのドメイン
//! モデルはプレーンな名前を維持し、ビジネスロジックや永続化処理に限定して使用します。

pub mod auth;
pub mod common;
pub mod decopon_sessions;
pub mod logs;
pub mod preferences;
pub mod profiles;
pub mod tags;
pub mod tasks;
