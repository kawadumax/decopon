use axum::{
    Extension, Json, Router,
    extract::{Path, State},
    routing::get,
};
use axum_macros::debug_handler;
use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::{
    AppState, dto::logs::*, errors::ApiError, extractors::authenticated_user::AuthenticatedUser,
    usecases::logs,
};

#[debug_handler]
#[tracing::instrument(skip(db, user))]
async fn index(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<Json<Vec<LogResponse>>, ApiError> {
    let logs_vec = logs::get_logs(&db, user.id).await?;
    let dto = logs_vec.into_iter().map(LogResponse::from).collect();
    Ok(Json(dto))
}

#[debug_handler]
#[tracing::instrument(skip(db, user))]
async fn logs_by_task(
    Path(task_id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<Json<Vec<LogResponse>>, ApiError> {
    let logs_vec = logs::get_logs_by_task(&db, user.id, task_id).await?;
    let dto = logs_vec.into_iter().map(LogResponse::from).collect();
    Ok(Json(dto))
}

#[debug_handler]
#[tracing::instrument(skip(db, user))]
async fn store(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<StoreLogRequest>,
) -> Result<Json<LogResponse>, ApiError> {
    let params = logs::NewLog {
        content: payload.content,
        source: payload.source,
        task_id: payload.task_id,
        user_id: user.id,
    };
    let log = logs::insert_log(&db, params).await?;
    Ok(Json(LogResponse::from(log)))
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/", get(index).post(store))
        .route("/task/{task_id}", get(logs_by_task))
}
