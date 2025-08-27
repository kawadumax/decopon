use crate::{entities::users, errors::ApiError, services};
use axum_password_worker::{Bcrypt, PasswordWorker};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ActiveValue, DatabaseConnection, EntityTrait};

pub struct UpdateProfile {
    pub name: Option<String>,
    pub email: Option<String>,
}

pub struct UpdatePassword {
    pub current_password: String,
    pub password: String,
}

pub struct DeleteProfile {
    pub password: String,
}

pub async fn get_profile(
    db: &DatabaseConnection,
    user_id: i32,
) -> Result<services::users::User, ApiError> {
    let user = users::Entity::find_by_id(user_id).one(db).await?;
    let user = user.ok_or(ApiError::NotFound("user"))?;
    Ok(user.into())
}

pub async fn update_profile(
    db: &DatabaseConnection,
    user_id: i32,
    params: UpdateProfile,
) -> Result<services::users::User, ApiError> {
    let mut user: users::ActiveModel = users::Entity::find_by_id(user_id)
        .one(db)
        .await?
        .ok_or(ApiError::NotFound("user"))?
        .into();

    if let Some(name) = params.name {
        user.name = ActiveValue::Set(name);
    }

    if let Some(email) = params.email {
        user.email = ActiveValue::Set(email);
        user.email_verified_at = ActiveValue::Set(None);
    }

    user.updated_at = ActiveValue::Set(Utc::now());

    let user = user.update(db).await?;
    Ok(user.into())
}

pub async fn update_password(
    db: &DatabaseConnection,
    password_worker: &PasswordWorker<Bcrypt>,
    user_id: i32,
    params: UpdatePassword,
) -> Result<(), ApiError> {
    let user = users::Entity::find_by_id(user_id)
        .one(db)
        .await?
        .ok_or(ApiError::NotFound("user"))?;

    let is_valid =
        services::auth::verify_password(&params.current_password, &user.password, password_worker)
            .await?;

    if !is_valid {
        return Err(ApiError::Unauthorized);
    }

    let hashed = services::auth::hash_password(&params.password, password_worker).await?;

    let mut user: users::ActiveModel = user.into();
    user.password = ActiveValue::Set(hashed);
    user.updated_at = ActiveValue::Set(Utc::now());
    user.update(db).await?;
    Ok(())
}

pub async fn delete_profile(
    db: &DatabaseConnection,
    password_worker: &PasswordWorker<Bcrypt>,
    user_id: i32,
    params: DeleteProfile,
) -> Result<(), ApiError> {
    let user = users::Entity::find_by_id(user_id)
        .one(db)
        .await?
        .ok_or(ApiError::NotFound("user"))?;

    let is_valid =
        services::auth::verify_password(&params.password, &user.password, password_worker).await?;

    if !is_valid {
        return Err(ApiError::Unauthorized);
    }

    let user: users::ActiveModel = user.into();
    user.delete(db).await?;
    Ok(())
}
