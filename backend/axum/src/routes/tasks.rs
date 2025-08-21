use axum::{
    extract::{Path, State},
    response::Json,
    routing::get,
    Router,
};

use sea_orm::DatabaseConnection;
use sea_orm::prelude::DateTimeUtc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{errors::ApiError, services::tasks, AppState};

#[derive(Serialize)]
pub struct TaskDto {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub completed: bool,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub parent_task_id: Option<i32>,
}

async fn index(
    State(db): State<Arc<DatabaseConnection>>,
) -> Result<Json<Vec<TaskDto>>, ApiError> {
    let tasks = tasks::get_tasks(&db).await?;
    Ok(Json(tasks))
}

async fn show(
    Path(id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
) -> Result<Json<TaskDto>, ApiError> {
    let task = tasks::get_task_by_id(&db, id).await?;
    Ok(Json(task))
}

#[derive(Serialize, Deserialize)]
pub struct StoreTaskDto {
    pub title: String,
    pub description: String,
    pub parent_task_id: Option<i32>,
    pub tag_ids: Option<Vec<i32>>,
}

async fn store(
    State(db): State<Arc<DatabaseConnection>>,
    Json(payload): Json<StoreTaskDto>,
) -> Result<Json<TaskDto>, ApiError> {
    let insert_result = tasks::insert_task(&db, payload).await?;
    let inserted_task = tasks::get_task_by_id(&db, insert_result.last_insert_id).await?;
    Ok(Json(inserted_task))
}

#[derive(Serialize, Deserialize)]
pub struct UpdateTaskDto {
    pub id: i32,
    pub title: Option<String>,
    pub description: Option<String>,
    pub completed: Option<bool>,
    pub parent_task_id: Option<i32>,
    pub tag_ids: Option<Vec<i32>>,
}

async fn update(
    State(db): State<Arc<DatabaseConnection>>,
    Json(payload): Json<UpdateTaskDto>,
) -> Result<Json<TaskDto>, ApiError> {
    let updated_task = tasks::update_task(&db, payload).await?;
    Ok(Json(updated_task))
}

#[derive(Serialize, Deserialize)]
pub struct DeleteTaskDto {
    pub id: i32,
}

async fn destroy(
    State(db): State<Arc<DatabaseConnection>>,
    Json(payload): Json<DeleteTaskDto>,
) -> Result<(), ApiError> {
    tasks::delete_task(&db, payload.id).await?;
    Ok(())
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/", get(index).post(store))
        .route("/{id}", get(show).put(update).delete(destroy))
}
