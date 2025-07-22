use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::get,
};

use sea_orm::DatabaseConnection;
use sea_orm::prelude::DateTimeUtc;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::AppState;
use crate::services::tasks;

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
) -> Result<Json<Vec<TaskDto>>, StatusCode> {
    let tasks = tasks::get_tasks(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let tasks: Vec<TaskDto> = tasks.into_iter().map(Into::into).collect();
    Ok(Json(tasks))
}

async fn show(
    Path(id): Path<i32>,
    State(db): State<Arc<DatabaseConnection>>,
) -> Result<Json<TaskDto>, StatusCode> {
    let task = tasks::get_task_by_id(&db, id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(task.into()))
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
) -> Result<Json<TaskDto>, StatusCode> {
    let insert_result = tasks::insert_task(&db, payload)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let inserted_task = tasks::get_task_by_id(&db, insert_result.last_insert_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

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
) -> Result<Json<TaskDto>, StatusCode> {
    let updated_task = tasks::update_task(&db, payload)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(updated_task))
}

#[derive(Serialize, Deserialize)]
pub struct DeleteTaskDto {
    pub id: i32,
}

async fn destroy(
    State(db): State<Arc<DatabaseConnection>>,
    Json(payload): Json<DeleteTaskDto>,
) -> Result<(), StatusCode> {
    tasks::delete_task(&db, payload.id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(())
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/", get(index).post(store))
        .route("/{id}", get(show).put(update).delete(destroy))
}
