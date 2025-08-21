use crate::entities::users;
use crate::errors::ApiError;
use crate::routes::auth::{UserDto, UserFullDto};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

impl From<users::Model> for UserDto {
    fn from(model: users::Model) -> Self {
        UserDto {
            id: model.id,
            email: model.email,
            name: model.name,
            work_time: model.work_time,
            break_time: model.break_time,
            locale: model.locale,
        }
    }
}

impl From<users::Model> for UserFullDto {
    fn from(model: users::Model) -> Self {
        UserFullDto {
            id: model.id,
            email: model.email,
            password: model.password,
            email_verified_at: model.email_verified_at,
            name: model.name,
            work_time: model.work_time,
            break_time: model.break_time,
            locale: model.locale,
            verification_token: model.verification_token,
        }
    }
}

impl From<UserFullDto> for UserDto {
    fn from(dto: UserFullDto) -> Self {
        UserDto {
            id: dto.id,
            email: dto.email,
            name: dto.name,
            work_time: dto.work_time,
            break_time: dto.break_time,
            locale: dto.locale,
        }
    }
}

pub async fn get_user_by_id(db: &DatabaseConnection, user_id: i32) -> Result<UserDto, ApiError> {
    let user = users::Entity::find_by_id(user_id).one(db).await?;
    user.map(UserDto::from).ok_or(ApiError::NotFound("user"))
}

pub async fn get_user_by_email(
    db: &DatabaseConnection,
    email: &String,
) -> Result<UserFullDto, ApiError> {
    let user = users::Entity::find()
        .filter(users::Column::Email.eq(email))
        .one(db)
        .await?;
    user.map(UserFullDto::from)
        .ok_or(ApiError::NotFound("user"))
}
