use axum::{
    Extension, Router,
    extract::State,
    response::Json,
    routing::{delete, get, post},
};
use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::dto::tags::*;
use crate::{
    AppState, errors::ApiError, extractors::authenticated_user::AuthenticatedUser, services::tags,
};

async fn index(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
) -> Result<Json<Vec<TagResponseDto>>, ApiError> {
    let tags = tags::get_tags(&db, user.id).await?;
    Ok(Json(tags.into_iter().map(TagResponseDto::from).collect()))
}

async fn store(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<StoreTagRequestDto>,
) -> Result<Json<TagResponseDto>, ApiError> {
    let params = tags::NewTag {
        name: payload.name,
        user_id: user.id,
    };
    let tag = tags::insert_tag(&db, params).await?;
    Ok(Json(TagResponseDto::from(tag)))
}

async fn store_relation(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<TagRelationRequestDto>,
) -> Result<Json<TagResponseDto>, ApiError> {
    let tag = tags::attach_tag_to_task(&db, user.id, payload.task_id, payload.name).await?;
    Ok(Json(TagResponseDto::from(tag)))
}

async fn destroy_relation(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<TagRelationRequestDto>,
) -> Result<Json<Option<TagResponseDto>>, ApiError> {
    let tag = tags::detach_tag_from_task(&db, user.id, payload.task_id, payload.name).await?;
    Ok(Json(tag.map(TagResponseDto::from)))
}

async fn destroy_multiple(
    State(db): State<Arc<DatabaseConnection>>,
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<DeleteTagsRequestDto>,
) -> Result<(), ApiError> {
    tags::delete_tags(&db, user.id, payload.tag_ids).await?;
    Ok(())
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/", get(index).post(store))
        .route("/relation", post(store_relation).delete(destroy_relation))
        .route("/multiple", delete(destroy_multiple))
}
