use crate::{
    entities::{prelude::*, *},
    errors::ApiError,
};

use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectionTrait, DatabaseConnection, EntityTrait, QueryFilter,
    Set, TransactionTrait,
};

async fn attach_tags_inner(
    db: &impl ConnectionTrait, // DB connection or transaction
    task_id: i32,
    tag_ids: Vec<i32>,
) -> Result<(), ApiError> {
    for tag_id in tag_ids {
        let tag_task = tag_task::ActiveModel {
            task_id: Set(task_id),
            tag_id: Set(tag_id),
            ..Default::default()
        };
        tag_task.insert(db).await?;
    }
    Ok(())
}

pub async fn attach_tags(
    db: &DatabaseConnection,
    task_id: i32,
    tag_ids: Vec<i32>,
) -> Result<(), ApiError> {
    // create transaction to ensure atomicity
    let txn = db.begin().await?;
    attach_tags_inner(&txn, task_id, tag_ids).await?;
    txn.commit().await.map_err(Into::into)
}

pub async fn sync_tags(
    db: &impl ConnectionTrait,
    task_id: i32,
    new_tag_ids: Vec<i32>,
) -> Result<(), ApiError> {
    // 既存のリレーションを全て削除
    TagTask::delete_many()
        .filter(tag_task::Column::TaskId.eq(task_id))
        .exec(db)
        .await?;
    // 新しいリレーションを追加
    attach_tags_inner(db, task_id, new_tag_ids).await
}

async fn detach_tags_inner(
    db: &impl ConnectionTrait, // accepts transaction or connection
    task_id: i32,
    tag_ids: Vec<i32>,
) -> Result<(), ApiError> {
    for tag_id in tag_ids {
        TagTask::delete_many()
            .filter(tag_task::Column::TaskId.eq(task_id))
            .filter(tag_task::Column::TagId.eq(tag_id))
            .exec(db)
            .await?;
    }
    Ok(())
}

pub async fn detach_tags(
    db: &DatabaseConnection,
    task_id: i32,
    tag_ids: Vec<i32>,
) -> Result<(), ApiError> {
    // create transaction to ensure atomicity
    let txn = db.begin().await?;
    detach_tags_inner(&txn, task_id, tag_ids).await?;
    txn.commit().await.map_err(Into::into)
}
