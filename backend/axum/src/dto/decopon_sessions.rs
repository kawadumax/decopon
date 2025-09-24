use sea_orm::prelude::DateTimeUtc;
use serde::{Deserialize, Serialize};

use crate::usecases::decopon_sessions::DecoponSession;

#[derive(Serialize)]
pub struct DecoponSessionResponse {
    pub id: i32,
    pub status: String,
    pub started_at: DateTimeUtc,
    pub ended_at: Option<DateTimeUtc>,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub user_id: i32,
}

impl From<DecoponSession> for DecoponSessionResponse {
    fn from(s: DecoponSession) -> Self {
        Self {
            id: s.id,
            status: s.status,
            started_at: s.started_at,
            ended_at: s.ended_at,
            created_at: s.created_at,
            updated_at: s.updated_at,
            user_id: s.user_id,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StoreDecoponSessionRequest {
    pub status: String,
    pub started_at: DateTimeUtc,
    pub ended_at: Option<DateTimeUtc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateDecoponSessionRequest {
    pub status: Option<String>,
    pub ended_at: Option<DateTimeUtc>,
}

#[derive(Serialize)]
pub struct CycleCountResponse {
    pub date: String,
    pub count: u64,
}
