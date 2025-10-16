use std::sync::Arc;

use axum_password_worker::{Bcrypt, PasswordWorker};
use lettre::SmtpTransport;
use sea_orm::DatabaseConnection;

use crate::usecases::single_user::SingleUserSession;

#[derive(Clone)]
pub struct ServiceContext {
    db: Arc<DatabaseConnection>,
    password_worker: Arc<PasswordWorker<Bcrypt>>,
    mailer: Option<Arc<SmtpTransport>>,
    jwt_secret: String,
    single_user_session: Option<SingleUserSession>,
}

impl ServiceContext {
    pub fn builder(
        db: Arc<DatabaseConnection>,
        password_worker: Arc<PasswordWorker<Bcrypt>>,
        jwt_secret: String,
    ) -> ServiceContextBuilder {
        ServiceContextBuilder {
            db,
            password_worker,
            jwt_secret,
            mailer: None,
            single_user_session: None,
        }
    }

    pub fn db(&self) -> &DatabaseConnection {
        self.db.as_ref()
    }

    pub fn db_arc(&self) -> Arc<DatabaseConnection> {
        Arc::clone(&self.db)
    }

    pub fn password_worker(&self) -> &PasswordWorker<Bcrypt> {
        self.password_worker.as_ref()
    }

    pub fn password_worker_arc(&self) -> Arc<PasswordWorker<Bcrypt>> {
        Arc::clone(&self.password_worker)
    }

    pub fn mailer(&self) -> Option<&Arc<SmtpTransport>> {
        self.mailer.as_ref()
    }

    pub fn mailer_arc(&self) -> Option<Arc<SmtpTransport>> {
        self.mailer.as_ref().map(Arc::clone)
    }

    pub fn jwt_secret(&self) -> &str {
        &self.jwt_secret
    }

    pub fn single_user_session(&self) -> Option<&SingleUserSession> {
        self.single_user_session.as_ref()
    }

    pub fn single_user_session_owned(&self) -> Option<SingleUserSession> {
        self.single_user_session.clone()
    }
}

pub struct ServiceContextBuilder {
    db: Arc<DatabaseConnection>,
    password_worker: Arc<PasswordWorker<Bcrypt>>,
    jwt_secret: String,
    mailer: Option<Arc<SmtpTransport>>,
    single_user_session: Option<SingleUserSession>,
}

impl ServiceContextBuilder {
    pub fn mailer(mut self, mailer: Option<Arc<SmtpTransport>>) -> Self {
        self.mailer = mailer;
        self
    }

    pub fn single_user_session(mut self, session: Option<SingleUserSession>) -> Self {
        self.single_user_session = session;
        self
    }

    pub fn build(self) -> ServiceContext {
        ServiceContext {
            db: self.db,
            password_worker: self.password_worker,
            mailer: self.mailer,
            jwt_secret: self.jwt_secret,
            single_user_session: self.single_user_session,
        }
    }
}
