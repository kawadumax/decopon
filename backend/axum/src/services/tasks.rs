use crate::{
    entities::{prelude::*, *},
    errors::ApiError,
    services,
};

use sea_orm::prelude::DateTimeUtc;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, DeleteResult, EntityTrait,
    QueryFilter, QuerySelect, QueryTrait, TransactionTrait,
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
    pub parent_task_id: Option<i32>,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub tags: Vec<TaskTag>,
}

pub struct TaskTag {
    pub id: i32,
    pub name: String,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
}

impl Task {
    fn from_model(task: tasks::Model, tags: Vec<tags::Model>) -> Self {
        let tags = tags
            .into_iter()
            .map(|tag| TaskTag {
                id: tag.id,
                name: tag.name,
                created_at: tag.created_at,
                updated_at: tag.updated_at,
            })
            .collect();

        Self {
            id: task.id,
            title: task.title,
            description: task.description,
            completed: task.completed,
            parent_task_id: task.parent_task_id,
            created_at: task.created_at,
            updated_at: task.updated_at,
            tags,
        }
    }
}

pub async fn get_tasks(
    db: &DatabaseConnection,
    user_id: i32,
    tag_ids: Option<Vec<i32>>,
) -> Result<Vec<Task>, ApiError> {
    let mut query = Tasks::find().filter(tasks::Column::UserId.eq(user_id));
    if let Some(tag_ids) = tag_ids {
        let subquery = tag_task::Entity::find()
            .select_only()
            .column(tag_task::Column::TaskId)
            .filter(tag_task::Column::TagId.is_in(tag_ids))
            .into_query();

        query = query.filter(tasks::Column::Id.in_subquery(subquery));
    }
    let tasks = query
        .find_with_related(Tags)
        .all(db)
        .await?
        .into_iter()
        .map(|(task, tags)| Task::from_model(task, tags))
        .collect::<Vec<Task>>();

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

    let (task, tags) = Tasks::find_by_id(inserted_result.last_insert_id)
        .find_with_related(Tags)
        .all(db)
        .await?
        .into_iter()
        .next()
        .ok_or(ApiError::NotFound("task"))?;

    Ok(Task::from_model(task, tags))
}

pub async fn get_task_by_id(
    db: &DatabaseConnection,
    user_id: i32,
    id: i32,
) -> Result<Task, ApiError> {
    let (task, tags) = Tasks::find()
        .filter(tasks::Column::Id.eq(id))
        .filter(tasks::Column::UserId.eq(user_id))
        .find_with_related(Tags)
        .all(db)
        .await?
        .into_iter()
        .next()
        .ok_or(ApiError::NotFound("task"))?;
    Ok(Task::from_model(task, tags))
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
    // Update the parent only when a new value is provided; otherwise keep the current value.
    task.parent_task_id = match params.parent_task_id {
        Some(parent_id) => ActiveValue::Set(Some(parent_id)),
        None => ActiveValue::NotSet,
    };
    task.updated_at = ActiveValue::Set(chrono::Utc::now());

    let txn = db.begin().await?;
    let task = task.update(&txn).await?;
    if let Some(tag_ids) = params.tag_ids {
        services::tag_task::sync_tags(&txn, id, tag_ids).await?;
    }
    txn.commit().await?;

    if params.completed == Some(true) {
        services::logs::insert_log(
            db,
            services::logs::NewLog {
                content: format!("Task \"{}\" completed.", task.title),
                source: services::logs::LogSource::System,
                task_id: Some(id),
                user_id: params.user_id,
            },
        )
        .await?;
    }

    let (task, tags) = Tasks::find_by_id(id)
        .find_with_related(Tags)
        .all(db)
        .await?
        .into_iter()
        .next()
        .ok_or(ApiError::NotFound("task"))?;

    Ok(Task::from_model(task, tags))
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
