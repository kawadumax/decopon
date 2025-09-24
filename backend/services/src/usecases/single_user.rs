//! シングルユーザーモード有効時に既定アカウントを生成し、固定 JWT を払い出すユーティリティです。
//! バックエンド起動時に `ensure_user` を呼び出し、`.env` 由来のプロフィール初期値でユーザーを作成・更新します。

use crate::{
    entities::users as users_entity,
    errors::ServiceError,
    usecases::{auth, users::User},
};
use axum_password_worker::{Bcrypt, PasswordWorker};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use std::env;
use tracing::info;

#[derive(Clone, Debug)]
pub struct SingleUserSession {
    pub token: String,
    pub user: User,
}

struct SingleUserConfig {
    email: String,
    password: String,
    name: String,
    locale: String,
    work_time: i32,
    break_time: i32,
}

impl SingleUserConfig {
    fn from_env() -> Self {
        let email = env::var("APP_SINGLE_USER_EMAIL")
            .unwrap_or_else(|_| "single-user@localhost".to_string());
        let password = env::var("APP_SINGLE_USER_PASSWORD")
            .unwrap_or_else(|_| "decopon-local-password".to_string());
        let name = env::var("APP_SINGLE_USER_NAME").unwrap_or_else(|_| "Decopon User".to_string());
        let locale = env::var("APP_SINGLE_USER_LOCALE").unwrap_or_else(|_| "en".to_string());
        let work_time = parse_i32_env("APP_SINGLE_USER_WORK_TIME", 25);
        let break_time = parse_i32_env("APP_SINGLE_USER_BREAK_TIME", 5);

        Self {
            email,
            password,
            name,
            locale,
            work_time,
            break_time,
        }
    }
}

fn parse_i32_env(key: &str, default: i32) -> i32 {
    match env::var(key) {
        Ok(value) => match value.parse::<i32>() {
            Ok(parsed) => parsed,
            Err(err) => {
                tracing::warn!(%key, %value, ?err, "failed to parse integer env, using default");
                default
            }
        },
        Err(_) => default,
    }
}

pub async fn ensure_user(
    db: &DatabaseConnection,
    password_worker: &PasswordWorker<Bcrypt>,
    jwt_secret: &str,
) -> Result<SingleUserSession, ServiceError> {
    let config = SingleUserConfig::from_env();
    let hashed_password = auth::hash_password(&config.password, password_worker).await?;
    let now = Utc::now();

    let existing = users_entity::Entity::find()
        .filter(users_entity::Column::Email.eq(config.email.clone()))
        .one(db)
        .await?;

    let model = if let Some(existing) = existing {
        let mut user: users_entity::ActiveModel = existing.into();
        user.name = Set(config.name.clone());
        user.password = Set(hashed_password.clone());
        user.email_verified_at = Set(Some(now));
        user.verification_token = Set(None);
        user.work_time = Set(config.work_time);
        user.break_time = Set(config.break_time);
        user.locale = Set(config.locale.clone());
        user.updated_at = Set(now);
        user.update(db).await?
    } else {
        users_entity::ActiveModel {
            name: Set(config.name.clone()),
            email: Set(config.email.clone()),
            password: Set(hashed_password.clone()),
            email_verified_at: Set(Some(now)),
            verification_token: Set(None),
            work_time: Set(config.work_time),
            break_time: Set(config.break_time),
            locale: Set(config.locale.clone()),
            ..Default::default()
        }
        .insert(db)
        .await?
    };

    let user: User = model.into();
    let token = auth::create_jwt(user.id, jwt_secret)?;

    info!(user_id = user.id, email = %config.email, "single user mode enabled");

    Ok(SingleUserSession { token, user })
}
