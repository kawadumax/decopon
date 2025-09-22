use axum::{
    extract::{Path, Query, State},
    Extension, Router,
    http::StatusCode,
    response::Json,
    routing::get,
};

use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::dto::tasks::*;
use crate::{
    AppState, errors::ApiError, extractors::authenticated_user::AuthenticatedUser, services::tasks,
};

#[tracing::instrument(skip(db, user))]
async fn index(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Query(params): Query<Vec<(String, String)>>,
) -> Result<Json<Vec<TaskResponseDto>>, ApiError> {
    let tag_ids: Vec<i32> = params
        .into_iter()
        .filter(|(k, _)| k == "tag_ids")
        .filter_map(|(_, v)| v.parse::<i32>().ok())
        .collect();
    let tag_ids = if tag_ids.is_empty() { None } else { Some(tag_ids) };
    let tasks = tasks::get_tasks(&db, user.id, tag_ids).await?;
    let tasks = tasks.into_iter().map(TaskResponseDto::from).collect();
    Ok(Json(tasks))
}

#[tracing::instrument(skip(db, user))]
async fn show(
    Path(id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<Json<TaskResponseDto>, ApiError> {
    let task = tasks::get_task_by_id(&db, user.id, id).await?;
    Ok(Json(TaskResponseDto::from(task)))
}

#[tracing::instrument(skip(db, user))]
async fn store(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<StoreTaskRequestDto>,
) -> Result<Json<TaskResponseDto>, ApiError> {
    let params = tasks::NewTask {
        title: payload.title,
        description: payload.description,
        parent_task_id: payload.parent_task_id,
        tag_ids: payload.tag_ids,
        user_id: user.id,
    };
    let task = tasks::insert_task(&db, params).await?;
    Ok(Json(TaskResponseDto::from(task)))
}

#[tracing::instrument(skip(db, user))]
async fn update(
    Path(id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<UpdateTaskRequestDto>,
) -> Result<Json<TaskResponseDto>, ApiError> {
    let params = tasks::TaskUpdate {
        id,
        title: payload.title,
        description: payload.description,
        completed: payload.completed,
        parent_task_id: payload.parent_task_id,
        tag_ids: payload.tag_ids,
        user_id: user.id,
    };
    let task = tasks::update_task(&db, params).await?;
    Ok(Json(TaskResponseDto::from(task)))
}

#[tracing::instrument(skip(db, user))]
async fn destroy(
    Path(id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<StatusCode, ApiError> {
    tasks::delete_task(&db, id, user.id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/", get(index).post(store))
        .route("/{id}", get(show).put(update).delete(destroy))
}
