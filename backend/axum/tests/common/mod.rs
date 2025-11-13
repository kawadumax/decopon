#![cfg(feature = "web")]

use std::sync::Arc;

use axum_password_worker::{Bcrypt, PasswordWorker};
use decopon_axum::{AppState, ServiceContext};
use lettre::SmtpTransport;
use migration::{Migrator, MigratorTrait};
use sea_orm::{ConnectionTrait, Database, DatabaseConnection, DbBackend, Statement};

/// Create an in-memory SQLite database, apply migrations, and optionally enable foreign keys.
pub async fn setup_in_memory_db(enable_foreign_keys: bool) -> Arc<DatabaseConnection> {
    let db = Database::connect("sqlite::memory:")
        .await
        .expect("connect sqlite memory");
    Migrator::up(&db, None).await.expect("run migrations");

    if enable_foreign_keys {
        db.execute(Statement::from_string(
            DbBackend::Sqlite,
            "PRAGMA foreign_keys = ON".to_owned(),
        ))
        .await
        .expect("enable foreign keys");
    }

    Arc::new(db)
}

fn test_password_worker() -> Arc<PasswordWorker<Bcrypt>> {
    Arc::new(PasswordWorker::new_bcrypt(1).expect("create password worker"))
}

fn test_mailer() -> Arc<SmtpTransport> {
    Arc::new(SmtpTransport::builder_dangerous("localhost").build())
}

/// Build an `AppState` using the provided database handle and JWT secret.
pub fn build_app_state(db: &Arc<DatabaseConnection>, jwt_secret: impl Into<String>) -> AppState {
    AppState::from(
        ServiceContext::builder(Arc::clone(db), test_password_worker(), jwt_secret.into())
            .mailer(Some(test_mailer()))
            .build(),
    )
}
