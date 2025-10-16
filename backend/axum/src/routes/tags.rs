use axum::{
    Extension, Router,
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{delete, get, post},
};
use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::dto::tags::*;
use crate::{
    AppState, errors::ApiError, extractors::authenticated_user::AuthenticatedUser, usecases::tags,
};

#[tracing::instrument(skip(db, user))]
async fn index(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<Json<Vec<TagResponse>>, ApiError> {
    let tags = tags::get_tags(&db, user.id).await?;
    Ok(Json(tags.into_iter().map(TagResponse::from).collect()))
}

#[tracing::instrument(skip(db, user))]
async fn store(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<StoreTagRequest>,
) -> Result<Json<TagResponse>, ApiError> {
    let params = tags::NewTag {
        name: payload.name,
        user_id: user.id,
    };
    let tag = tags::insert_tag(&db, params).await?;
    Ok(Json(TagResponse::from(tag)))
}

#[tracing::instrument(skip(db, user))]
async fn store_relation(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<TagRelationRequest>,
) -> Result<Json<TagResponse>, ApiError> {
    let tag = tags::attach_tag_to_task(&db, user.id, payload.task_id, payload.name).await?;
    Ok(Json(TagResponse::from(tag)))
}

#[tracing::instrument(skip(db, user))]
async fn destroy_relation(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<TagRelationRequest>,
) -> Result<Json<Option<TagResponse>>, ApiError> {
    let tag = tags::detach_tag_from_task(&db, user.id, payload.task_id, payload.name).await?;
    Ok(Json(tag.map(TagResponse::from)))
}

#[tracing::instrument(skip(db, user))]
async fn destroy_multiple(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<DeleteTagsRequest>,
) -> Result<StatusCode, ApiError> {
    tags::delete_tags(&db, user.id, payload.tag_ids).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/", get(index).post(store))
        .route("/relation", post(store_relation).delete(destroy_relation))
        .route("/multiple", delete(destroy_multiple))
}
