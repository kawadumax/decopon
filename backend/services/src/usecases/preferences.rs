use crate::{entities::users, errors::ServiceError, usecases::users::User};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ActiveValue, DatabaseConnection, EntityTrait};

pub struct UpdatePreference {
    pub work_time: i32,
    pub break_time: i32,
    pub locale: String,
}

pub async fn update_preference(
    db: &DatabaseConnection,
    user_id: i32,
    params: UpdatePreference,
) -> Result<User, ServiceError> {
    let mut user: users::ActiveModel = users::Entity::find_by_id(user_id)
        .one(db)
        .await?
        .ok_or(ServiceError::NotFound("user"))?
        .into();

    user.work_time = ActiveValue::Set(params.work_time);
    user.break_time = ActiveValue::Set(params.break_time);
    user.locale = ActiveValue::Set(params.locale);
    user.updated_at = ActiveValue::Set(Utc::now());

    let user = user.update(db).await?;
    Ok(user.into())
}
