use async_trait::async_trait;
use chrono::{DateTime, NaiveDate, Utc};
use decopon_services::ServiceError;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::{
    error::{IpcError, IpcResult},
    AppIpcState,
};

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DecoponSession {
    pub id: i32,
    pub status: String,
    pub started_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_id: i32,
}

impl From<decopon_services::usecases::decopon_sessions::DecoponSession> for DecoponSession {
    fn from(value: decopon_services::usecases::decopon_sessions::DecoponSession) -> Self {
        Self {
            id: value.id,
            status: value.status,
            started_at: value.started_at,
            ended_at: value.ended_at,
            created_at: value.created_at,
            updated_at: value.updated_at,
            user_id: value.user_id,
        }
    }
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ListDecoponSessionsRequest {
    pub user_id: i32,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GetDecoponSessionRequest {
    pub id: i32,
    pub user_id: i32,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CreateDecoponSessionRequest {
    pub status: String,
    pub started_at: DateTime<Utc>,
    #[serde(default)]
    pub ended_at: Option<DateTime<Utc>>,
    pub user_id: i32,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDecoponSessionRequest {
    pub id: i32,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub ended_at: Option<DateTime<Utc>>,
    pub user_id: i32,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteDecoponSessionRequest {
    pub id: i32,
    pub user_id: i32,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CountDecoponCyclesRequest {
    pub user_id: i32,
    pub date: String,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DecoponSessionResponse {
    pub session: DecoponSession,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DecoponSessionsResponse {
    pub sessions: Vec<DecoponSession>,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteDecoponSessionResponse {
    pub success: bool,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CycleCountResponse {
    pub date: String,
    pub count: u64,
}

#[async_trait]
pub trait DecoponSessionHandler: Send + Sync {
    async fn list_decopon_sessions(
        &self,
        user_id: i32,
    ) -> Result<Vec<DecoponSession>, ServiceError>;
    async fn get_decopon_session(
        &self,
        id: i32,
        user_id: i32,
    ) -> Result<DecoponSession, ServiceError>;
    async fn create_decopon_session(
        &self,
        request: CreateDecoponSessionRequest,
    ) -> Result<DecoponSession, ServiceError>;
    async fn update_decopon_session(
        &self,
        request: UpdateDecoponSessionRequest,
    ) -> Result<DecoponSession, ServiceError>;
    async fn delete_decopon_session(
        &self,
        request: DeleteDecoponSessionRequest,
    ) -> Result<bool, ServiceError>;
    async fn count_decopon_cycles(
        &self,
        user_id: i32,
        date: NaiveDate,
    ) -> Result<u64, ServiceError>;
}

async fn list_decopon_sessions_inner(
    handler: &dyn DecoponSessionHandler,
    request: ListDecoponSessionsRequest,
) -> IpcResult<DecoponSessionsResponse> {
    handler
        .list_decopon_sessions(request.user_id)
        .await
        .map(|sessions| DecoponSessionsResponse { sessions })
        .map_err(IpcError::from)
}

async fn get_decopon_session_inner(
    handler: &dyn DecoponSessionHandler,
    request: GetDecoponSessionRequest,
) -> IpcResult<DecoponSessionResponse> {
    handler
        .get_decopon_session(request.id, request.user_id)
        .await
        .map(|session| DecoponSessionResponse { session })
        .map_err(IpcError::from)
}

async fn create_decopon_session_inner(
    handler: &dyn DecoponSessionHandler,
    request: CreateDecoponSessionRequest,
) -> IpcResult<DecoponSessionResponse> {
    handler
        .create_decopon_session(request)
        .await
        .map(|session| DecoponSessionResponse { session })
        .map_err(IpcError::from)
}

async fn update_decopon_session_inner(
    handler: &dyn DecoponSessionHandler,
    request: UpdateDecoponSessionRequest,
) -> IpcResult<DecoponSessionResponse> {
    handler
        .update_decopon_session(request)
        .await
        .map(|session| DecoponSessionResponse { session })
        .map_err(IpcError::from)
}

async fn delete_decopon_session_inner(
    handler: &dyn DecoponSessionHandler,
    request: DeleteDecoponSessionRequest,
) -> IpcResult<DeleteDecoponSessionResponse> {
    handler
        .delete_decopon_session(request)
        .await
        .map(|success| DeleteDecoponSessionResponse { success })
        .map_err(IpcError::from)
}

async fn count_decopon_cycles_inner(
    handler: &dyn DecoponSessionHandler,
    request: CountDecoponCyclesRequest,
) -> IpcResult<CycleCountResponse> {
    let CountDecoponCyclesRequest { user_id, date } = request;
    let parsed = NaiveDate::parse_from_str(&date, "%Y-%m-%d").map_err(|err| {
        IpcError::new(
            "decoponSessions.invalidDate",
            format!("日付の形式が正しくありません: {err}"),
        )
    })?;
    handler
        .count_decopon_cycles(user_id, parsed)
        .await
        .map(|count| CycleCountResponse { date, count })
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn list_decopon_sessions(
    services: State<'_, AppIpcState>,
    request: ListDecoponSessionsRequest,
) -> IpcResult<DecoponSessionsResponse> {
    let handler: &dyn DecoponSessionHandler = services.inner().as_ref();
    list_decopon_sessions_inner(handler, request).await
}

#[tauri::command]
pub async fn get_decopon_session(
    services: State<'_, AppIpcState>,
    request: GetDecoponSessionRequest,
) -> IpcResult<DecoponSessionResponse> {
    let handler: &dyn DecoponSessionHandler = services.inner().as_ref();
    get_decopon_session_inner(handler, request).await
}

#[tauri::command]
pub async fn create_decopon_session(
    services: State<'_, AppIpcState>,
    request: CreateDecoponSessionRequest,
) -> IpcResult<DecoponSessionResponse> {
    let handler: &dyn DecoponSessionHandler = services.inner().as_ref();
    create_decopon_session_inner(handler, request).await
}

#[tauri::command]
pub async fn update_decopon_session(
    services: State<'_, AppIpcState>,
    request: UpdateDecoponSessionRequest,
) -> IpcResult<DecoponSessionResponse> {
    let handler: &dyn DecoponSessionHandler = services.inner().as_ref();
    update_decopon_session_inner(handler, request).await
}

#[tauri::command]
pub async fn delete_decopon_session(
    services: State<'_, AppIpcState>,
    request: DeleteDecoponSessionRequest,
) -> IpcResult<DeleteDecoponSessionResponse> {
    let handler: &dyn DecoponSessionHandler = services.inner().as_ref();
    delete_decopon_session_inner(handler, request).await
}

#[tauri::command]
pub async fn count_decopon_cycles(
    services: State<'_, AppIpcState>,
    request: CountDecoponCyclesRequest,
) -> IpcResult<CycleCountResponse> {
    let handler: &dyn DecoponSessionHandler = services.inner().as_ref();
    count_decopon_cycles_inner(handler, request).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use chrono::{Duration, TimeZone, Utc};
    use decopon_services::ServiceError;
    use std::sync::{
        atomic::{AtomicI32, Ordering},
        Arc, Mutex,
    };

    #[derive(Default)]
    struct MockDecoponSessions {
        sessions: Mutex<Vec<DecoponSession>>,
        next_id: AtomicI32,
    }

    impl MockDecoponSessions {
        fn new() -> Arc<Self> {
            Arc::new(Self {
                sessions: Mutex::new(Vec::new()),
                next_id: AtomicI32::new(1),
            })
        }
    }

    #[async_trait]
    impl DecoponSessionHandler for MockDecoponSessions {
        async fn list_decopon_sessions(
            &self,
            user_id: i32,
        ) -> Result<Vec<DecoponSession>, ServiceError> {
            let sessions = self.sessions.lock().unwrap();
            Ok(sessions
                .iter()
                .filter(|s| s.user_id == user_id)
                .cloned()
                .collect())
        }

        async fn get_decopon_session(
            &self,
            id: i32,
            user_id: i32,
        ) -> Result<DecoponSession, ServiceError> {
            let sessions = self.sessions.lock().unwrap();
            sessions
                .iter()
                .find(|s| s.id == id && s.user_id == user_id)
                .cloned()
                .ok_or_else(|| ServiceError::NotFound("decopon_session"))
        }

        async fn create_decopon_session(
            &self,
            request: CreateDecoponSessionRequest,
        ) -> Result<DecoponSession, ServiceError> {
            let CreateDecoponSessionRequest {
                status,
                started_at,
                ended_at,
                user_id,
            } = request;
            let id = self.next_id.fetch_add(1, Ordering::SeqCst);
            let created_at = started_at.clone();
            let updated_at = started_at.clone();
            let session = DecoponSession {
                id,
                status,
                started_at,
                ended_at,
                created_at,
                updated_at,
                user_id,
            };
            self.sessions.lock().unwrap().push(session.clone());
            Ok(session)
        }

        async fn update_decopon_session(
            &self,
            request: UpdateDecoponSessionRequest,
        ) -> Result<DecoponSession, ServiceError> {
            let mut sessions = self.sessions.lock().unwrap();
            let session = sessions
                .iter_mut()
                .find(|s| s.id == request.id && s.user_id == request.user_id)
                .ok_or_else(|| ServiceError::NotFound("decopon_session"))?;
            if let Some(status) = request.status {
                session.status = status;
            }
            if let Some(ended_at) = request.ended_at {
                session.ended_at = Some(ended_at);
            }
            session.updated_at = session.updated_at + Duration::seconds(1);
            Ok(session.clone())
        }

        async fn delete_decopon_session(
            &self,
            request: DeleteDecoponSessionRequest,
        ) -> Result<bool, ServiceError> {
            let mut sessions = self.sessions.lock().unwrap();
            let len_before = sessions.len();
            sessions.retain(|s| !(s.id == request.id && s.user_id == request.user_id));
            Ok(len_before != sessions.len())
        }

        async fn count_decopon_cycles(
            &self,
            user_id: i32,
            date: NaiveDate,
        ) -> Result<u64, ServiceError> {
            let sessions = self.sessions.lock().unwrap();
            let start_ndt = date.and_hms_opt(0, 0, 0).unwrap();
            let end_ndt = start_ndt + Duration::days(1);
            let start = Utc.from_utc_datetime(&start_ndt);
            let end = Utc.from_utc_datetime(&end_ndt);
            let count = sessions
                .iter()
                .filter(|s| {
                    s.user_id == user_id
                        && s.status == "Completed"
                        && s.ended_at
                            .map(|ended| ended >= start && ended < end)
                            .unwrap_or(false)
                })
                .count();
            Ok(count as u64)
        }
    }

    #[test]
    fn create_decopon_session_command_returns_created_session() {
        tauri::async_runtime::block_on(async {
            let handler = MockDecoponSessions::new();
            let request = CreateDecoponSessionRequest {
                status: "Running".to_string(),
                started_at: Utc.with_ymd_and_hms(2024, 1, 1, 8, 0, 0).unwrap(),
                ended_at: None,
                user_id: 1,
            };
            let response = create_decopon_session_inner(handler.as_ref(), request)
                .await
                .unwrap();
            assert_eq!(response.session.status, "Running");
            assert_eq!(response.session.user_id, 1);
        });
    }

    #[test]
    fn update_decopon_session_command_updates_session() {
        tauri::async_runtime::block_on(async {
            let handler = MockDecoponSessions::new();
            let created = create_decopon_session_inner(
                handler.as_ref(),
                CreateDecoponSessionRequest {
                    status: "Running".to_string(),
                    started_at: Utc.with_ymd_and_hms(2024, 1, 1, 8, 0, 0).unwrap(),
                    ended_at: None,
                    user_id: 1,
                },
            )
            .await
            .unwrap();

            let ended_at = Some(Utc.with_ymd_and_hms(2024, 1, 1, 8, 25, 0).unwrap());
            let response = update_decopon_session_inner(
                handler.as_ref(),
                UpdateDecoponSessionRequest {
                    id: created.session.id,
                    status: Some("Completed".to_string()),
                    ended_at,
                    user_id: 1,
                },
            )
            .await
            .unwrap();

            assert_eq!(response.session.status, "Completed");
            assert_eq!(response.session.ended_at, ended_at);
        });
    }

    #[test]
    fn delete_decopon_session_command_removes_session() {
        tauri::async_runtime::block_on(async {
            let handler = MockDecoponSessions::new();
            let created = create_decopon_session_inner(
                handler.as_ref(),
                CreateDecoponSessionRequest {
                    status: "Running".to_string(),
                    started_at: Utc.with_ymd_and_hms(2024, 1, 1, 8, 0, 0).unwrap(),
                    ended_at: None,
                    user_id: 1,
                },
            )
            .await
            .unwrap();

            let response = delete_decopon_session_inner(
                handler.as_ref(),
                DeleteDecoponSessionRequest {
                    id: created.session.id,
                    user_id: 1,
                },
            )
            .await
            .unwrap();

            assert!(response.success);
            let list = list_decopon_sessions_inner(
                handler.as_ref(),
                ListDecoponSessionsRequest { user_id: 1 },
            )
            .await
            .unwrap();
            assert!(list.sessions.is_empty());
        });
    }

    #[test]
    fn count_decopon_cycles_command_counts_completed_sessions() {
        tauri::async_runtime::block_on(async {
            let handler = MockDecoponSessions::new();
            let first = create_decopon_session_inner(
                handler.as_ref(),
                CreateDecoponSessionRequest {
                    status: "Running".to_string(),
                    started_at: Utc.with_ymd_and_hms(2024, 1, 1, 8, 0, 0).unwrap(),
                    ended_at: None,
                    user_id: 1,
                },
            )
            .await
            .unwrap();
            update_decopon_session_inner(
                handler.as_ref(),
                UpdateDecoponSessionRequest {
                    id: first.session.id,
                    status: Some("Completed".to_string()),
                    ended_at: Some(Utc.with_ymd_and_hms(2024, 1, 1, 8, 25, 0).unwrap()),
                    user_id: 1,
                },
            )
            .await
            .unwrap();

            let second = create_decopon_session_inner(
                handler.as_ref(),
                CreateDecoponSessionRequest {
                    status: "Running".to_string(),
                    started_at: Utc.with_ymd_and_hms(2024, 1, 1, 10, 0, 0).unwrap(),
                    ended_at: None,
                    user_id: 1,
                },
            )
            .await
            .unwrap();
            update_decopon_session_inner(
                handler.as_ref(),
                UpdateDecoponSessionRequest {
                    id: second.session.id,
                    status: Some("Completed".to_string()),
                    ended_at: Some(Utc.with_ymd_and_hms(2024, 1, 1, 10, 30, 0).unwrap()),
                    user_id: 1,
                },
            )
            .await
            .unwrap();

            // Session that should not be counted (different day)
            let third = create_decopon_session_inner(
                handler.as_ref(),
                CreateDecoponSessionRequest {
                    status: "Running".to_string(),
                    started_at: Utc.with_ymd_and_hms(2024, 1, 2, 9, 0, 0).unwrap(),
                    ended_at: None,
                    user_id: 1,
                },
            )
            .await
            .unwrap();
            update_decopon_session_inner(
                handler.as_ref(),
                UpdateDecoponSessionRequest {
                    id: third.session.id,
                    status: Some("Completed".to_string()),
                    ended_at: Some(Utc.with_ymd_and_hms(2024, 1, 2, 9, 30, 0).unwrap()),
                    user_id: 1,
                },
            )
            .await
            .unwrap();

            let response = count_decopon_cycles_inner(
                handler.as_ref(),
                CountDecoponCyclesRequest {
                    user_id: 1,
                    date: "2024-01-01".to_string(),
                },
            )
            .await
            .unwrap();

            assert_eq!(response.count, 2);
            assert_eq!(response.date, "2024-01-01");
        });
    }
}
