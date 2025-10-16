use crate::entities::users;
use crate::errors::ServiceError;
use chrono::{DateTime, Utc};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

#[derive(Clone, Debug)]
pub struct User {
    pub id: i32,
    pub email: String,
    pub name: String,
    pub work_time: i32,
    pub break_time: i32,
    pub locale: String,
}

#[derive(Clone, Debug)]
pub struct UserFull {
    pub id: i32,
    pub email: String,
    pub name: String,
    pub password: String,
    pub email_verified_at: Option<DateTime<Utc>>,
    pub work_time: i32,
    pub break_time: i32,
    pub locale: String,
    pub verification_token: Option<String>,
}

impl From<users::Model> for User {
    fn from(model: users::Model) -> Self {
        User {
            id: model.id,
            email: model.email,
            name: model.name,
            work_time: model.work_time,
            break_time: model.break_time,
            locale: model.locale,
        }
    }
}

impl From<users::Model> for UserFull {
    fn from(model: users::Model) -> Self {
        UserFull {
            id: model.id,
            email: model.email,
            name: model.name,
            password: model.password,
            email_verified_at: model.email_verified_at,
            work_time: model.work_time,
            break_time: model.break_time,
            locale: model.locale,
            verification_token: model.verification_token,
        }
    }
}

impl From<UserFull> for User {
    fn from(user: UserFull) -> Self {
        User {
            id: user.id,
            email: user.email,
            name: user.name,
            work_time: user.work_time,
            break_time: user.break_time,
            locale: user.locale,
        }
    }
}

pub async fn get_user_by_id(db: &DatabaseConnection, user_id: i32) -> Result<User, ServiceError> {
    let user = users::Entity::find_by_id(user_id).one(db).await?;
    user.map(User::from).ok_or(ServiceError::NotFound("user"))
}

pub async fn get_user_by_email(
    db: &DatabaseConnection,
    email: &String,
) -> Result<UserFull, ServiceError> {
    let user = users::Entity::find()
        .filter(users::Column::Email.eq(email))
        .one(db)
        .await?;
    user.map(UserFull::from)
        .ok_or(ServiceError::NotFound("user"))
}
