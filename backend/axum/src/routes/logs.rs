use axum::{
    extract::{Path, Query, State},
    routing::get,
    Router, Json,
};
use std::sync::Arc;
use sea_orm::DatabaseConnection;
use axum_macros::debug_handler;

use crate::{dto::logs::*, errors::ApiError, services::logs, AppState};

#[derive(serde::Deserialize)]
struct UserQuery { user_id: i32 }

#[debug_handler]
async fn index(
    State(db): State<Arc<DatabaseConnection>>,
    Query(user): Query<UserQuery>,
) -> Result<Json<Vec<LogResponseDto>>, ApiError> {
    let logs_vec = logs::get_logs(&db, user.user_id).await?;
    let dto = logs_vec.into_iter().map(LogResponseDto::from).collect();
    Ok(Json(dto))
}

#[debug_handler]
async fn logs_by_task(
    Path(task_id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
    Query(user): Query<UserQuery>,
) -> Result<Json<Vec<LogResponseDto>>, ApiError> {
    let logs_vec = logs::get_logs_by_task(&db, user.user_id, task_id).await?;
    let dto = logs_vec.into_iter().map(LogResponseDto::from).collect();
    Ok(Json(dto))
}

#[debug_handler]
async fn store(
    State(db): State<Arc<DatabaseConnection>>,
    Json(payload): Json<StoreLogRequestDto>,
) -> Result<Json<LogResponseDto>, ApiError> {
    let params = logs::NewLog {
        content: payload.content,
        source: payload.source,
        task_id: payload.task_id,
        user_id: payload.user_id,
    };
    let log = logs::insert_log(&db, params).await?;
    Ok(Json(LogResponseDto::from(log)))
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/", get(index).post(store))
        .route("/task/:task_id", get(logs_by_task))
}
