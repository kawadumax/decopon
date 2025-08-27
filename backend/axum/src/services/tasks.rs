use crate::{
    entities::{prelude::*, *},
    errors::ApiError,
    services,
};

use sea_orm::prelude::DateTimeUtc;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, DeleteResult, EntityTrait,
    QueryFilter, TransactionTrait,
};

pub struct NewTask {
    pub title: String,
    pub description: String,
    pub parent_task_id: Option<i32>,
    pub tag_ids: Option<Vec<i32>>,
    pub user_id: i32,
}

pub struct TaskUpdate {
    pub id: i32,
    pub title: Option<String>,
    pub description: Option<String>,
    pub completed: Option<bool>,
    pub parent_task_id: Option<i32>,
    pub tag_ids: Option<Vec<i32>>,
    pub user_id: i32,
}

pub struct Task {
    pub id: i32,
    pub title: String,
    pub description: String,
    pub completed: bool,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub parent_task_id: Option<i32>,
}

impl From<tasks::Model> for Task {
    fn from(task: tasks::Model) -> Self {
        Self {
            id: task.id,
            title: task.title,
            description: task.description,
            completed: task.completed,
            created_at: task.created_at,
            updated_at: task.updated_at,
            parent_task_id: task.parent_task_id,
        }
    }
}

pub async fn get_tasks(db: &DatabaseConnection, user_id: i32) -> Result<Vec<Task>, ApiError> {
    let tasks = Tasks::find()
        .filter(tasks::Column::UserId.eq(user_id))
        .all(db)
        .await?;

    let tasks = tasks.into_iter().map(Into::into).collect::<Vec<Task>>();

    Ok(tasks)
}

pub async fn insert_task(db: &DatabaseConnection, params: NewTask) -> Result<Task, ApiError> {
    let NewTask {
        title,
        description,
        parent_task_id,
        tag_ids,
        user_id,
    } = params;
    let new_task = tasks::ActiveModel {
        title: ActiveValue::Set(title),
        description: ActiveValue::Set(description),
        parent_task_id: ActiveValue::Set(parent_task_id),
        user_id: ActiveValue::Set(user_id),
        ..Default::default()
    };

    let inserted_result = Tasks::insert(new_task).exec(db).await?;

    // create relation between task and tags
    if let Some(tag_ids) = tag_ids {
        services::tag_task::attach_tags(db, inserted_result.last_insert_id, tag_ids).await?;
    }

    let task = Tasks::find_by_id(inserted_result.last_insert_id)
        .one(db)
        .await?
        .ok_or(ApiError::NotFound("task"))?;

    Ok(task.into())
}

pub async fn get_task_by_id(
    db: &DatabaseConnection,
    user_id: i32,
    id: i32,
) -> Result<Task, ApiError> {
    let task = Tasks::find()
        .filter(tasks::Column::Id.eq(id))
        .filter(tasks::Column::UserId.eq(user_id))
        .one(db)
        .await?;
    let task = task.ok_or(ApiError::NotFound("task"))?;
    Ok(task.into())
}

pub async fn update_task(db: &DatabaseConnection, params: TaskUpdate) -> Result<Task, ApiError> {
    let id = params.id;
    let mut task: tasks::ActiveModel = Tasks::find()
        .filter(tasks::Column::Id.eq(id))
        .filter(tasks::Column::UserId.eq(params.user_id))
        .one(db)
        .await?
        .ok_or(ApiError::NotFound("task"))?
        .into();

    if let Some(title) = params.title {
        task.title = ActiveValue::Set(title);
    }

    if let Some(description) = params.description {
        task.description = ActiveValue::Set(description);
    }

    if let Some(completed) = params.completed {
        task.completed = ActiveValue::Set(completed);
    }

    // TODO: recursive update for parent task
    // For now, we just update the parent_task_id if it is provided

    task.parent_task_id = ActiveValue::Set(params.parent_task_id);
    task.updated_at = ActiveValue::Set(chrono::Utc::now());

    let txn = db.begin().await?;
    let task = task.update(&txn).await?;
    if let Some(tag_ids) = params.tag_ids {
        services::tag_task::sync_tags(&txn, id, tag_ids).await?;
    }
    txn.commit().await?;

    Ok(task.into())
}

pub async fn delete_task(
    db: &DatabaseConnection,
    id: i32,
    user_id: i32,
) -> Result<DeleteResult, ApiError> {
    Tasks::delete_many()
        .filter(tasks::Column::Id.eq(id))
        .filter(tasks::Column::UserId.eq(user_id))
        .exec(db)
        .await
        .map_err(Into::into)
}
