use axum::{
    Extension, Router,
    extract::{Path, State},
    response::Json,
    routing::get,
};

use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::dto::tasks::*;
use crate::{
    AppState, errors::ApiError, extractors::authenticated_user::AuthenticatedUser, services::tasks,
};

async fn index(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<Json<Vec<TaskResponseDto>>, ApiError> {
    let tasks = tasks::get_tasks(&db, user.id).await?;
    let tasks = tasks.into_iter().map(TaskResponseDto::from).collect();
    Ok(Json(tasks))
}

async fn show(
    Path(id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<Json<TaskResponseDto>, ApiError> {
    let task = tasks::get_task_by_id(&db, user.id, id).await?;
    Ok(Json(TaskResponseDto::from(task)))
}

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

async fn update(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<UpdateTaskRequestDto>,
) -> Result<Json<TaskResponseDto>, ApiError> {
    let params = tasks::TaskUpdate {
        id: payload.id,
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

async fn destroy(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<DeleteTaskRequestDto>,
) -> Result<(), ApiError> {
    tasks::delete_task(&db, payload.id, user.id).await?;
    Ok(())
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/", get(index).post(store))
        .route("/{id}", get(show).put(update).delete(destroy))
}
