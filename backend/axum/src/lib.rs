pub mod dto;
pub mod entities;
pub mod errors;
pub mod extractors;
pub mod middleware;
pub mod routes;
pub mod services;

use axum::extract::FromRef;
use axum_password_worker::{Bcrypt, PasswordWorker};
use sea_orm::DatabaseConnection;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<DatabaseConnection>,
    pub password_worker: Arc<PasswordWorker<Bcrypt>>,
    pub mailer: Arc<lettre::SmtpTransport>,
}

impl FromRef<AppState> for Arc<DatabaseConnection> {
    fn from_ref(state: &AppState) -> Self {
        state.db.clone()
    }
}

impl FromRef<AppState> for Arc<PasswordWorker<Bcrypt>> {
    fn from_ref(state: &AppState) -> Self {
        state.password_worker.clone()
    }
}

impl FromRef<AppState> for Arc<lettre::SmtpTransport> {
    fn from_ref(state: &AppState) -> Self {
        state.mailer.clone()
    }
}
