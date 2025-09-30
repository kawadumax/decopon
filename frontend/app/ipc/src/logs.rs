use async_trait::async_trait;
use chrono::{DateTime, Utc};
use decopon_services::{usecases::logs as log_usecases, ServiceError};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::{
    error::{IpcError, IpcResult},
    AppIpcState,
};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum LogSource {
    System,
    User,
}

impl From<log_usecases::LogSource> for LogSource {
    fn from(value: log_usecases::LogSource) -> Self {
        match value {
            log_usecases::LogSource::System => LogSource::System,
            log_usecases::LogSource::User => LogSource::User,
        }
    }
}

impl From<LogSource> for log_usecases::LogSource {
    fn from(value: LogSource) -> Self {
        match value {
            LogSource::System => log_usecases::LogSource::System,
            LogSource::User => log_usecases::LogSource::User,
        }
    }
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Log {
    pub id: i32,
    pub content: String,
    pub source: LogSource,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_id: i32,
    pub task_id: Option<i32>,
}

impl From<log_usecases::Log> for Log {
    fn from(value: log_usecases::Log) -> Self {
        Self {
            id: value.id,
            content: value.content,
            source: value.source.into(),
            created_at: value.created_at,
            updated_at: value.updated_at,
            user_id: value.user_id,
            task_id: value.task_id,
        }
    }
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LogListResponse {
    pub logs: Vec<Log>,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LogResponse {
    pub log: Log,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LogListRequest {
    pub user_id: i32,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LogListByTaskRequest {
    pub user_id: i32,
    pub task_id: i32,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CreateLogRequest {
    pub user_id: i32,
    pub content: String,
    pub source: LogSource,
    #[serde(default)]
    pub task_id: Option<i32>,
}

#[async_trait]
pub trait LogHandler: Send + Sync {
    async fn list_logs(&self, request: LogListRequest) -> Result<Vec<Log>, ServiceError>;
    async fn list_logs_by_task(
        &self,
        request: LogListByTaskRequest,
    ) -> Result<Vec<Log>, ServiceError>;
    async fn create_log(&self, request: CreateLogRequest) -> Result<Log, ServiceError>;
}

async fn list_logs_internal(
    handler: &(dyn LogHandler + Send + Sync),
    request: LogListRequest,
) -> IpcResult<LogListResponse> {
    handler
        .list_logs(request)
        .await
        .map(|logs| LogListResponse { logs })
        .map_err(IpcError::from)
}

async fn list_logs_by_task_internal(
    handler: &(dyn LogHandler + Send + Sync),
    request: LogListByTaskRequest,
) -> IpcResult<LogListResponse> {
    handler
        .list_logs_by_task(request)
        .await
        .map(|logs| LogListResponse { logs })
        .map_err(IpcError::from)
}

async fn create_log_internal(
    handler: &(dyn LogHandler + Send + Sync),
    request: CreateLogRequest,
) -> IpcResult<LogResponse> {
    handler
        .create_log(request)
        .await
        .map(|log| LogResponse { log })
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn list_logs(
    services: State<'_, AppIpcState>,
    request: LogListRequest,
) -> IpcResult<LogListResponse> {
    let handler: &dyn LogHandler = services.inner().as_ref();
    list_logs_internal(handler, request).await
}

#[tauri::command]
pub async fn list_logs_by_task(
    services: State<'_, AppIpcState>,
    request: LogListByTaskRequest,
) -> IpcResult<LogListResponse> {
    let handler: &dyn LogHandler = services.inner().as_ref();
    list_logs_by_task_internal(handler, request).await
}

#[tauri::command]
pub async fn create_log(
    services: State<'_, AppIpcState>,
    request: CreateLogRequest,
) -> IpcResult<LogResponse> {
    let handler: &dyn LogHandler = services.inner().as_ref();
    create_log_internal(handler, request).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{
        atomic::{AtomicI32, Ordering},
        Mutex,
    };

    use async_trait::async_trait;
    use chrono::Utc;
    use decopon_services::ServiceError;

    #[derive(Default)]
    struct MockLogService {
        logs: Mutex<Vec<Log>>,
        next_id: AtomicI32,
    }

    impl MockLogService {
        fn new() -> Self {
            Self {
                logs: Mutex::new(Vec::new()),
                next_id: AtomicI32::new(1),
            }
        }
    }

    #[async_trait]
    impl LogHandler for MockLogService {
        async fn list_logs(&self, request: LogListRequest) -> Result<Vec<Log>, ServiceError> {
            let logs = self.logs.lock().unwrap();
            Ok(logs
                .iter()
                .filter(|log| log.user_id == request.user_id)
                .cloned()
                .collect())
        }

        async fn list_logs_by_task(
            &self,
            request: LogListByTaskRequest,
        ) -> Result<Vec<Log>, ServiceError> {
            let logs = self.logs.lock().unwrap();
            Ok(logs
                .iter()
                .filter(|log| {
                    log.user_id == request.user_id && log.task_id == Some(request.task_id)
                })
                .cloned()
                .collect())
        }

        async fn create_log(&self, request: CreateLogRequest) -> Result<Log, ServiceError> {
            let mut logs = self.logs.lock().unwrap();
            let id = self.next_id.fetch_add(1, Ordering::SeqCst);
            let now = Utc::now();
            let CreateLogRequest {
                user_id,
                content,
                source,
                task_id,
            } = request;
            let log = Log {
                id,
                content,
                source,
                created_at: now,
                updated_at: now,
                user_id,
                task_id,
            };
            logs.push(log.clone());
            Ok(log)
        }
    }

    #[test]
    fn log_crud_flow() {
        let handler = MockLogService::new();

        tauri::async_runtime::block_on(async {
            let first = create_log_internal(
                &handler,
                CreateLogRequest {
                    user_id: 1,
                    content: "first log".into(),
                    source: LogSource::System,
                    task_id: Some(10),
                },
            )
            .await
            .unwrap()
            .log;

            let second = create_log_internal(
                &handler,
                CreateLogRequest {
                    user_id: 1,
                    content: "second log".into(),
                    source: LogSource::User,
                    task_id: None,
                },
            )
            .await
            .unwrap()
            .log;

            assert_eq!(first.id, 1);
            assert_eq!(second.id, 2);

            let all = list_logs_internal(&handler, LogListRequest { user_id: 1 })
                .await
                .unwrap();
            assert_eq!(all.logs.len(), 2);

            let task_logs = list_logs_by_task_internal(
                &handler,
                LogListByTaskRequest {
                    user_id: 1,
                    task_id: 10,
                },
            )
            .await
            .unwrap();
            assert_eq!(task_logs.logs, vec![first]);
        });
    }
}
