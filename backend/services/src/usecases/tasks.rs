use crate::{
    entities::{prelude::*, tag_task, *},
    errors::ServiceError,
};

use super::{logs, tag_task as tag_task_usecase};

use sea_orm::prelude::DateTimeUtc;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, ConnectionTrait, DatabaseBackend,
    DatabaseConnection, DeleteResult, EntityName, EntityTrait, FromQueryResult, QueryFilter,
    QueryOrder, QuerySelect, QueryTrait, Statement, TransactionTrait,
};
use std::collections::HashMap;

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
    pub root_task_id: Option<i32>,
    pub depth: i32,
    pub position: i32,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub tags: Vec<TaskTag>,
}

pub struct TaskSubtreeNode {
    pub task: Task,
    pub relative_depth: i32,
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
            root_task_id: task.root_task_id,
            depth: task.depth,
            position: task.position,
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
) -> Result<Vec<Task>, ServiceError> {
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
        .order_by_asc(tasks::Column::RootTaskId)
        .order_by_asc(tasks::Column::Depth)
        .order_by_asc(tasks::Column::Position)
        .find_with_related(Tags)
        .all(db)
        .await?
        .into_iter()
        .map(|(task, tags)| Task::from_model(task, tags))
        .collect::<Vec<Task>>();

    Ok(tasks)
}

pub async fn insert_task(db: &DatabaseConnection, params: NewTask) -> Result<Task, ServiceError> {
    let NewTask {
        title,
        description,
        parent_task_id,
        tag_ids,
        user_id,
    } = params;

    let txn = db.begin().await?;
    let hierarchy = build_hierarchy_context(&txn, user_id, parent_task_id).await?;
    let new_task = tasks::ActiveModel {
        title: ActiveValue::Set(title),
        description: ActiveValue::Set(description),
        parent_task_id: ActiveValue::Set(hierarchy.parent_task_id),
        user_id: ActiveValue::Set(user_id),
        root_task_id: ActiveValue::Set(hierarchy.root_task_id),
        depth: ActiveValue::Set(hierarchy.depth),
        position: ActiveValue::Set(hierarchy.position),
        ..Default::default()
    };

    let inserted_result = Tasks::insert(new_task).exec(&txn).await?;

    if hierarchy.root_task_id.is_none() {
        let mut inserted: tasks::ActiveModel = Tasks::find_by_id(inserted_result.last_insert_id)
            .one(&txn)
            .await?
            .ok_or(ServiceError::NotFound("task"))?
            .into();
        inserted.root_task_id = ActiveValue::Set(Some(inserted_result.last_insert_id));
        inserted.update(&txn).await?;
    }

    // create relation between task and tags
    if let Some(tag_ids) = tag_ids {
        tag_task_usecase::attach_tags_with_conn(&txn, inserted_result.last_insert_id, tag_ids)
            .await?;
    }

    txn.commit().await?;

    let (task, tags) = find_task_with_tags(db, user_id, inserted_result.last_insert_id).await?;

    Ok(Task::from_model(task, tags))
}

pub async fn get_task_by_id(
    db: &DatabaseConnection,
    user_id: i32,
    id: i32,
) -> Result<Task, ServiceError> {
    let (task, tags) = find_task_with_tags(db, user_id, id).await?;
    Ok(Task::from_model(task, tags))
}

pub async fn update_task(
    db: &DatabaseConnection,
    params: TaskUpdate,
) -> Result<Task, ServiceError> {
    let id = params.id;
    let current_task = Tasks::find()
        .filter(tasks::Column::Id.eq(id))
        .filter(tasks::Column::UserId.eq(params.user_id))
        .one(db)
        .await?
        .ok_or(ServiceError::NotFound("task"))?;
    let mut task: tasks::ActiveModel = current_task.clone().into();

    if let Some(title) = params.title {
        task.title = ActiveValue::Set(title);
    }

    if let Some(description) = params.description {
        task.description = ActiveValue::Set(description);
    }

    if let Some(completed) = params.completed {
        task.completed = ActiveValue::Set(completed);
    }

    if let Some(new_parent_id) = params.parent_task_id {
        if current_task.parent_task_id != Some(new_parent_id) {
            return Err(ServiceError::BadRequest(
                "changing parent task hierarchy is not supported yet".to_string(),
            ));
        }
    }

    task.parent_task_id = match params.parent_task_id {
        Some(parent_id) => ActiveValue::Set(Some(parent_id)),
        None => ActiveValue::NotSet,
    };
    task.updated_at = ActiveValue::Set(chrono::Utc::now());

    let txn = db.begin().await?;
    let task = task.update(&txn).await?;
    if let Some(tag_ids) = params.tag_ids {
        tag_task_usecase::sync_tags(&txn, id, tag_ids).await?;
    }
    txn.commit().await?;

    if params.completed == Some(true) {
        logs::insert_log(
            db,
            logs::NewLog {
                content: format!("Task \"{}\" completed.", task.title),
                source: logs::LogSource::System,
                task_id: Some(id),
                user_id: params.user_id,
                tag_ids: Vec::new(),
                tag_names: Vec::new(),
            },
        )
        .await?;
    }

    let (task, tags) = find_task_with_tags(db, params.user_id, id).await?;

    Ok(Task::from_model(task, tags))
}

pub async fn delete_task(
    db: &DatabaseConnection,
    id: i32,
    user_id: i32,
) -> Result<DeleteResult, ServiceError> {
    Tasks::delete_many()
        .filter(tasks::Column::Id.eq(id))
        .filter(tasks::Column::UserId.eq(user_id))
        .exec(db)
        .await
        .map_err(Into::into)
}

pub async fn get_task_subtree(
    db: &DatabaseConnection,
    user_id: i32,
    task_id: i32,
) -> Result<Vec<TaskSubtreeNode>, ServiceError> {
    let rows = query_task_subtree_rows(db, user_id, task_id).await?;
    if rows.is_empty() {
        return Err(ServiceError::NotFound("task"));
    }

    let ids: Vec<i32> = rows.iter().map(|row| row.id).collect();
    let mut task_map = HashMap::new();
    let task_models = Tasks::find()
        .filter(tasks::Column::UserId.eq(user_id))
        .filter(tasks::Column::Id.is_in(ids))
        .find_with_related(Tags)
        .all(db)
        .await?;
    for (task, tags) in task_models {
        task_map.insert(task.id, Task::from_model(task, tags));
    }

    let mut nodes = Vec::with_capacity(rows.len());
    for row in rows {
        if let Some(task) = task_map.remove(&row.id) {
            nodes.push(TaskSubtreeNode {
                task,
                relative_depth: row.relative_depth,
            });
        }
    }

    if nodes.is_empty() {
        return Err(ServiceError::NotFound("task"));
    }

    Ok(nodes)
}

struct HierarchyContext {
    parent_task_id: Option<i32>,
    root_task_id: Option<i32>,
    depth: i32,
    position: i32,
}

#[allow(dead_code)]
#[derive(Debug, FromQueryResult)]
struct TaskSubtreeRow {
    id: i32,
    relative_depth: i32,
    depth: i32,
    position: i32,
}

async fn find_task_with_tags(
    db: &DatabaseConnection,
    user_id: i32,
    id: i32,
) -> Result<(tasks::Model, Vec<tags::Model>), ServiceError> {
    Tasks::find()
        .filter(tasks::Column::Id.eq(id))
        .filter(tasks::Column::UserId.eq(user_id))
        .find_with_related(Tags)
        .all(db)
        .await?
        .into_iter()
        .next()
        .ok_or(ServiceError::NotFound("task"))
}

async fn build_hierarchy_context(
    conn: &impl ConnectionTrait,
    user_id: i32,
    parent_task_id: Option<i32>,
) -> Result<HierarchyContext, ServiceError> {
    let position = next_position(conn, user_id, parent_task_id).await?;
    if let Some(parent_id) = parent_task_id {
        let parent = Tasks::find()
            .filter(tasks::Column::Id.eq(parent_id))
            .filter(tasks::Column::UserId.eq(user_id))
            .one(conn)
            .await?
            .ok_or(ServiceError::NotFound("task"))?;
        Ok(HierarchyContext {
            parent_task_id: Some(parent_id),
            root_task_id: Some(parent.root_task_id.unwrap_or(parent.id)),
            depth: parent.depth + 1,
            position,
        })
    } else {
        Ok(HierarchyContext {
            parent_task_id: None,
            root_task_id: None,
            depth: 0,
            position,
        })
    }
}

async fn next_position(
    conn: &impl ConnectionTrait,
    user_id: i32,
    parent_task_id: Option<i32>,
) -> Result<i32, ServiceError> {
    let mut query = Tasks::find()
        .filter(tasks::Column::UserId.eq(user_id))
        .order_by_desc(tasks::Column::Position)
        .limit(1);

    match parent_task_id {
        Some(parent_id) => {
            query = query.filter(tasks::Column::ParentTaskId.eq(parent_id));
        }
        None => {
            query = query.filter(tasks::Column::ParentTaskId.is_null());
        }
    }

    let next = query
        .one(conn)
        .await?
        .map(|task| task.position + 1)
        .unwrap_or(0);
    Ok(next)
}

async fn query_task_subtree_rows(
    conn: &impl ConnectionTrait,
    user_id: i32,
    task_id: i32,
) -> Result<Vec<TaskSubtreeRow>, ServiceError> {
    let backend = conn.get_database_backend();
    let table_name = tasks::Entity.table_name();
    let (task_placeholder, user_placeholder) = match backend {
        DatabaseBackend::Postgres => ("$1", "$2"),
        _ => ("?", "?"),
    };
    let sql = format!(
        r#"
WITH RECURSIVE task_subtree AS (
    SELECT id, parent_task_id, depth, position, 0 AS relative_depth
    FROM {table}
    WHERE id = {task_placeholder} AND user_id = {user_placeholder}
    UNION ALL
    SELECT t.id, t.parent_task_id, t.depth, t.position, ts.relative_depth + 1 AS relative_depth
    FROM {table} t
    INNER JOIN task_subtree ts ON t.parent_task_id = ts.id
)
SELECT id, relative_depth, depth, position
FROM task_subtree
ORDER BY depth, position;
"#,
        table = table_name,
        task_placeholder = task_placeholder,
        user_placeholder = user_placeholder
    );
    let stmt = Statement::from_sql_and_values(backend, sql, vec![task_id.into(), user_id.into()]);
    let rows = TaskSubtreeRow::find_by_statement(stmt).all(conn).await?;
    Ok(rows)
}
