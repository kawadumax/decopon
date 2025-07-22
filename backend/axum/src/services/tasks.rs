use crate::{
    entities::{prelude::*, *},
    routes::tasks::{StoreTaskDto, TaskDto, UpdateTaskDto},
    services,
};

use sea_orm::{
    ActiveModelTrait, ActiveValue, DatabaseConnection, DbErr, DeleteResult, EntityTrait,
    InsertResult,
};

impl From<tasks::Model> for TaskDto {
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

fn not_found_error(id: i32) -> DbErr {
    DbErr::RecordNotFound(format!("Task with ID {} not found", id))
}

pub async fn get_tasks(db: &DatabaseConnection) -> Result<Vec<TaskDto>, DbErr> {
    // TODO: Implement filer by user_id
    // For now, we just fetch all tasks
    let tasks = Tasks::find().all(db).await?;

    let tasks = tasks.into_iter().map(Into::into).collect::<Vec<TaskDto>>();

    Ok(tasks)
}

pub async fn insert_task(
    db: &DatabaseConnection,
    request: StoreTaskDto,
) -> Result<InsertResult<tasks::ActiveModel>, DbErr> {
    let new_task = tasks::ActiveModel {
        title: ActiveValue::Set(request.title),
        description: ActiveValue::Set(request.description),
        parent_task_id: ActiveValue::Set(request.parent_task_id),
        ..Default::default()
    };

    let inserted_result = Tasks::insert(new_task).exec(db).await?;

    // create relation between task and tags
    if let Some(tag_ids) = request.tag_ids {
        services::tag_task::attach_tags(db, inserted_result.last_insert_id, tag_ids).await?;
    }

    Ok(inserted_result)
}

pub async fn get_task_by_id(db: &DatabaseConnection, id: i32) -> Result<TaskDto, DbErr> {
    let task = Tasks::find_by_id(id).one(db).await?;
    let task = task.ok_or(not_found_error(id))?;
    Ok(task.into())
}

pub async fn update_task(
    db: &DatabaseConnection,
    request: UpdateTaskDto,
) -> Result<TaskDto, DbErr> {
    let id = request.id;
    let mut task: tasks::ActiveModel = Tasks::find_by_id(id)
        .one(db)
        .await?
        .ok_or(not_found_error(id))?
        .into();

    if let Some(title) = request.title {
        task.title = ActiveValue::Set(title);
    }

    if let Some(description) = request.description {
        task.description = ActiveValue::Set(description);
    }

    if let Some(completed) = request.completed {
        task.completed = ActiveValue::Set(completed);
    }

    // TODO: recursive update for parent task
    // For now, we just update the parent_task_id if it is provided

    task.parent_task_id = ActiveValue::Set(request.parent_task_id);
    task.updated_at = ActiveValue::Set(chrono::Utc::now());

    // TODO: add transaction to ensure atomicity
    let task = task.update(db).await?;
    if let Some(tag_ids) = request.tag_ids {
        services::tag_task::sync_tags(db, id, tag_ids).await?;
    }

    Ok(task.into())
}

pub async fn delete_task(db: &DatabaseConnection, id: i32) -> Result<DeleteResult, DbErr> {
    Tasks::delete_by_id(id).exec(db).await
}
