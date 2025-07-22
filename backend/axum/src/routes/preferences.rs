use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::get,
};
use sea_orm::DatabaseConnection;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_posts).post(create_post))
        .route("/{id}", get(get_post))
        .with_state(db)
}
