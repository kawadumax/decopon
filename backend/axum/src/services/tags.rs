use crate::{
    entities::{prelude::*, *},
    errors::ApiError,
    services,
};

use sea_orm::prelude::DateTimeUtc;
use sea_orm::{
    ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
};

pub struct NewTag {
    pub name: String,
    pub user_id: i32,
}

pub struct Tag {
    pub id: i32,
    pub name: String,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub user_id: i32,
    pub task_count: u64,
}

impl From<tags::Model> for Tag {
    fn from(tag: tags::Model) -> Self {
        Self {
            id: tag.id,
            name: tag.name,
            created_at: tag.created_at,
            updated_at: tag.updated_at,
            user_id: tag.user_id,
            task_count: 0,
        }
    }
}

async fn tag_with_count(
    db: &DatabaseConnection,
    tag: tags::Model,
) -> Result<Tag, ApiError> {
    let mut tag: Tag = tag.into();
    tag.task_count = TagTask::find()
        .filter(tag_task::Column::TagId.eq(tag.id))
        .count(db)
        .await?;
    Ok(tag)
}

pub async fn get_tags(db: &DatabaseConnection, user_id: i32) -> Result<Vec<Tag>, ApiError> {
    let tags = Tags::find()
        .filter(tags::Column::UserId.eq(user_id))
        .all(db)
        .await?;
    let mut result = Vec::new();
    for tag in tags {
        result.push(tag_with_count(db, tag).await?);
    }
    Ok(result)
}

pub async fn insert_tag(db: &DatabaseConnection, params: NewTag) -> Result<Tag, ApiError> {
    let new_tag = tags::ActiveModel {
        name: ActiveValue::Set(params.name),
        user_id: ActiveValue::Set(params.user_id),
        ..Default::default()
    };
    let res = Tags::insert(new_tag).exec(db).await?;
    let tag = Tags::find_by_id(res.last_insert_id)
        .one(db)
        .await?
        .ok_or(ApiError::NotFound("tag"))?;
    tag_with_count(db, tag).await
}

pub async fn attach_tag_to_task(
    db: &DatabaseConnection,
    user_id: i32,
    task_id: i32,
    name: String,
) -> Result<Tag, ApiError> {
    let tag = Tags::find()
        .filter(tags::Column::Name.eq(name.clone()))
        .filter(tags::Column::UserId.eq(user_id))
        .one(db)
        .await?;

    let tag = match tag {
        Some(tag) => tag,
        None => {
            let new_tag = tags::ActiveModel {
                name: ActiveValue::Set(name),
                user_id: ActiveValue::Set(user_id),
                ..Default::default()
            };
            let res = Tags::insert(new_tag).exec(db).await?;
            Tags::find_by_id(res.last_insert_id)
                .one(db)
                .await?
                .ok_or(ApiError::NotFound("tag"))?
        }
    };

    services::tag_task::attach_tags(db, task_id, vec![tag.id]).await?;
    tag_with_count(db, tag).await
}

pub async fn detach_tag_from_task(
    db: &DatabaseConnection,
    user_id: i32,
    task_id: i32,
    name: String,
) -> Result<Option<Tag>, ApiError> {
    let tag = Tags::find()
        .filter(tags::Column::Name.eq(name))
        .filter(tags::Column::UserId.eq(user_id))
        .one(db)
        .await?;

    if let Some(tag) = &tag {
        services::tag_task::detach_tags(db, task_id, vec![tag.id]).await?;
    }
    if let Some(tag) = tag {
        Ok(Some(tag_with_count(db, tag).await?))
    } else {
        Ok(None)
    }
}

pub async fn delete_tags(
    db: &DatabaseConnection,
    user_id: i32,
    tag_ids: Vec<i32>,
) -> Result<(), ApiError> {
    Tags::delete_many()
        .filter(tags::Column::Id.is_in(tag_ids))
        .filter(tags::Column::UserId.eq(user_id))
        .exec(db)
        .await?;
    Ok(())
}
