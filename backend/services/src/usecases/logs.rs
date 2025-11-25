use crate::{
    entities::{log_tag, logs, prelude::*, tags, tasks},
    errors::ServiceError,
};

use sea_orm::prelude::DateTimeUtc;
use sea_orm::{
    ActiveValue, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait, JoinType,
    QueryFilter, QueryOrder, QuerySelect, RelationTrait, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum LogSource {
    System,
    User,
}

impl LogSource {
    fn as_str(&self) -> &'static str {
        match self {
            LogSource::System => "System",
            LogSource::User => "User",
        }
    }
}

impl From<String> for LogSource {
    fn from(value: String) -> Self {
        match value.as_str() {
            "System" => LogSource::System,
            _ => LogSource::User,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LogTagInfo {
    pub id: i32,
    pub name: String,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub user_id: i32,
}

impl From<tags::Model> for LogTagInfo {
    fn from(tag: tags::Model) -> Self {
        Self {
            id: tag.id,
            name: tag.name,
            created_at: tag.created_at,
            updated_at: tag.updated_at,
            user_id: tag.user_id,
        }
    }
}

pub struct NewLog {
    pub content: String,
    pub source: LogSource,
    pub task_id: Option<i32>,
    pub user_id: i32,
    pub tag_ids: Vec<i32>,
    pub tag_names: Vec<String>,
}

#[derive(Default)]
pub struct LogFilters {
    pub tag_ids: Vec<i32>,
    pub task_id: Option<i32>,
    pub task_name: Option<String>,
}

pub struct Log {
    pub id: i32,
    pub content: String,
    pub source: LogSource,
    pub created_at: DateTimeUtc,
    pub updated_at: DateTimeUtc,
    pub user_id: i32,
    pub task_id: Option<i32>,
    pub tags: Vec<LogTagInfo>,
}

impl Log {
    fn from_model(model: logs::Model, tags: Vec<tags::Model>) -> Self {
        Self {
            id: model.id,
            content: model.content,
            source: LogSource::from(model.source),
            created_at: model.created_at,
            updated_at: model.updated_at,
            user_id: model.user_id,
            task_id: model.task_id,
            tags: tags.into_iter().map(LogTagInfo::from).collect(),
        }
    }
}

fn normalize_tag_ids(mut ids: Vec<i32>) -> Vec<i32> {
    ids.sort_unstable();
    ids.dedup();
    ids
}

fn normalize_tag_names(names: Vec<String>) -> Vec<String> {
    let mut normalized = Vec::new();
    let mut seen = HashSet::new();
    for name in names {
        let trimmed = name.trim();
        if trimmed.is_empty() {
            continue;
        }
        if seen.insert(trimmed.to_string()) {
            normalized.push(trimmed.to_string());
        }
    }
    normalized
}

pub async fn get_logs(
    db: &DatabaseConnection,
    user_id: i32,
    filters: LogFilters,
) -> Result<Vec<Log>, ServiceError> {
    let mut query = Logs::find().filter(logs::Column::UserId.eq(user_id));

    if let Some(task_id) = filters.task_id {
        query = query.filter(logs::Column::TaskId.eq(task_id));
    }

    if let Some(task_name) = filters
        .task_name
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        query = query
            .join(JoinType::InnerJoin, logs::Relation::Tasks.def())
            .filter(tasks::Column::Title.contains(task_name));
    }

    let normalized_tag_ids = normalize_tag_ids(filters.tag_ids);
    if !normalized_tag_ids.is_empty() {
        let log_ids =
            find_log_ids_with_all_tags(db, &normalized_tag_ids).await?;
        if log_ids.is_empty() {
            return Ok(vec![]);
        }
        query = query.filter(logs::Column::Id.is_in(log_ids));
    }
    let logs = query
        .order_by_desc(logs::Column::CreatedAt)
        .find_with_related(Tags)
        .all(db)
        .await?;
    Ok(logs
        .into_iter()
        .map(|(log, tags)| Log::from_model(log, tags))
        .collect())
}

pub async fn get_logs_by_task(
    db: &DatabaseConnection,
    user_id: i32,
    task_id: i32,
) -> Result<Vec<Log>, ServiceError> {
    let logs = Logs::find()
        .filter(logs::Column::UserId.eq(user_id))
        .filter(logs::Column::TaskId.eq(task_id))
        .order_by_desc(logs::Column::CreatedAt)
        .find_with_related(Tags)
        .all(db)
        .await?;
    Ok(logs
        .into_iter()
        .map(|(log, tags)| Log::from_model(log, tags))
        .collect())
}

pub async fn insert_log(db: &DatabaseConnection, params: NewLog) -> Result<Log, ServiceError> {
    let txn = db.begin().await?;
    let log = insert_log_with_txn(&txn, params).await?;
    txn.commit().await?;
    Ok(log)
}

async fn insert_log_with_txn(
    txn: &DatabaseTransaction,
    params: NewLog,
) -> Result<Log, ServiceError> {
    let new_log = logs::ActiveModel {
        content: ActiveValue::Set(params.content),
        source: ActiveValue::Set(params.source.as_str().to_owned()),
        task_id: ActiveValue::Set(params.task_id),
        user_id: ActiveValue::Set(params.user_id),
        ..Default::default()
    };
    let result = Logs::insert(new_log).exec(txn).await?;
    let log = Logs::find_by_id(result.last_insert_id)
        .one(txn)
        .await?
        .ok_or(ServiceError::NotFound("log"))?;

    let tags =
        ensure_tags(txn, params.user_id, params.tag_ids, params.tag_names).await?;
    let tag_ids: Vec<i32> = tags.iter().map(|tag| tag.id).collect();
    if !tag_ids.is_empty() {
        attach_tags_to_log(txn, log.id, &tag_ids).await?;
    }

    Ok(Log::from_model(log, tags))
}

async fn ensure_tags(
    txn: &DatabaseTransaction,
    user_id: i32,
    tag_ids: Vec<i32>,
    tag_names: Vec<String>,
) -> Result<Vec<tags::Model>, ServiceError> {
    let mut collected: Vec<tags::Model> = Vec::new();
    let mut seen_ids: HashSet<i32> = HashSet::new();

    let normalized_ids = normalize_tag_ids(tag_ids);
    if !normalized_ids.is_empty() {
        let existing = Tags::find()
            .filter(tags::Column::UserId.eq(user_id))
            .filter(tags::Column::Id.is_in(normalized_ids.clone()))
            .all(txn)
            .await?;
        if existing.len() != normalized_ids.len() {
            return Err(ServiceError::NotFound("tag"));
        }
        for tag in existing {
            seen_ids.insert(tag.id);
            collected.push(tag);
        }
    }

    for name in normalize_tag_names(tag_names) {
        let tag = Tags::find()
            .filter(tags::Column::UserId.eq(user_id))
            .filter(tags::Column::Name.eq(name.clone()))
            .one(txn)
            .await?;
        let tag = match tag {
            Some(existing) => existing,
            None => {
                let new_tag = tags::ActiveModel {
                    name: ActiveValue::Set(name.clone()),
                    user_id: ActiveValue::Set(user_id),
                    ..Default::default()
                };
                let res = Tags::insert(new_tag).exec(txn).await?;
                Tags::find_by_id(res.last_insert_id)
                    .one(txn)
                    .await?
                    .ok_or(ServiceError::NotFound("tag"))?
            }
        };
        if seen_ids.insert(tag.id) {
            collected.push(tag);
        }
    }

    Ok(collected)
}

async fn attach_tags_to_log(
    txn: &DatabaseTransaction,
    log_id: i32,
    tag_ids: &[i32],
) -> Result<(), ServiceError> {
    let models = tag_ids
        .iter()
        .map(|tag_id| log_tag::ActiveModel {
            log_id: ActiveValue::Set(log_id),
            tag_id: ActiveValue::Set(*tag_id),
            ..Default::default()
        })
        .collect::<Vec<_>>();
    LogTag::insert_many(models).exec(txn).await?;
    Ok(())
}

async fn find_log_ids_with_all_tags(
    db: &DatabaseConnection,
    required_tag_ids: &[i32],
) -> Result<Vec<i32>, ServiceError> {
    let relations = LogTag::find()
        .filter(log_tag::Column::TagId.is_in(required_tag_ids.to_vec()))
        .all(db)
        .await?;
    if relations.is_empty() {
        return Ok(vec![]);
    }
    let required: HashSet<i32> = required_tag_ids.iter().copied().collect();
    let mut presence: HashMap<i32, HashSet<i32>> = HashMap::new();
    for relation in relations {
        presence
            .entry(relation.log_id)
            .or_default()
            .insert(relation.tag_id);
    }
    let matching = presence
        .into_iter()
        .filter_map(|(log_id, tags)| {
            if required.iter().all(|tag_id| tags.contains(tag_id)) {
                Some(log_id)
            } else {
                None
            }
        })
        .collect();
    Ok(matching)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::entities::{tags, users};
    use migration::{Migrator, MigratorTrait};
    use sea_orm::{ActiveModelTrait, Database, Set};

    async fn setup_db() -> DatabaseConnection {
        let db = Database::connect("sqlite::memory:").await.unwrap();
        Migrator::up(&db, None).await.unwrap();
        db
    }

    async fn create_user(db: &DatabaseConnection, name: &str) -> users::Model {
        users::ActiveModel {
            name: Set(name.to_string()),
            email: Set(format!("{}@example.com", name)),
            password: Set("hashed".to_string()),
            work_time: Set(25),
            break_time: Set(5),
            locale: Set("ja".to_string()),
            ..Default::default()
        }
        .insert(db)
        .await
        .unwrap()
    }

    async fn create_tag_entity(
        db: &DatabaseConnection,
        user_id: i32,
        name: &str,
    ) -> tags::Model {
        tags::ActiveModel {
            name: Set(name.to_string()),
            user_id: Set(user_id),
            ..Default::default()
        }
        .insert(db)
        .await
        .unwrap()
    }

    #[tokio::test]
    async fn insert_log_with_existing_and_new_tags() {
        let db = setup_db().await;
        let user = create_user(&db, "alice").await;
        let existing = create_tag_entity(&db, user.id, "existing").await;

        let log = insert_log(
            &db,
            NewLog {
                content: "log".to_string(),
                source: LogSource::User,
                task_id: None,
                user_id: user.id,
                tag_ids: vec![existing.id],
                tag_names: vec!["  new ".to_string(), "existing".to_string()],
            },
        )
        .await
        .unwrap();

        assert_eq!(log.tags.len(), 2);
        let names: HashSet<_> = log.tags.iter().map(|tag| tag.name.as_str()).collect();
        assert!(names.contains("existing"));
        assert!(names.contains("new"));
    }

    #[tokio::test]
    async fn insert_log_rejects_foreign_tags() {
        let db = setup_db().await;
        let owner = create_user(&db, "owner").await;
        let outsider = create_user(&db, "bob").await;
        let outsider_tag = create_tag_entity(&db, outsider.id, "secret").await;

        let result = insert_log(
            &db,
            NewLog {
                content: "nope".to_string(),
                source: LogSource::User,
                task_id: None,
                user_id: owner.id,
                tag_ids: vec![outsider_tag.id],
                tag_names: vec![],
            },
        )
        .await;

        assert!(matches!(result, Err(ServiceError::NotFound("tag"))));
    }

    #[tokio::test]
    async fn get_logs_filters_by_all_tags() {
        let db = setup_db().await;
        let user = create_user(&db, "filter").await;
        let tag_a = create_tag_entity(&db, user.id, "alpha").await;
        let tag_b = create_tag_entity(&db, user.id, "beta").await;

        let log1 = insert_log(
            &db,
            NewLog {
                content: "first".to_string(),
                source: LogSource::User,
                task_id: None,
                user_id: user.id,
                tag_ids: vec![tag_a.id],
                tag_names: vec![],
            },
        )
        .await
        .unwrap();
        let log2 = insert_log(
            &db,
            NewLog {
                content: "second".to_string(),
                source: LogSource::User,
                task_id: None,
                user_id: user.id,
                tag_ids: vec![tag_a.id, tag_b.id],
                tag_names: vec![],
            },
        )
        .await
        .unwrap();
        insert_log(
            &db,
            NewLog {
                content: "no tags".to_string(),
                source: LogSource::User,
                task_id: None,
                user_id: user.id,
                tag_ids: vec![],
                tag_names: vec![],
            },
        )
        .await
        .unwrap();

        let all_logs = get_logs(&db, user.id, LogFilters::default()).await.unwrap();
        assert_eq!(all_logs.len(), 3);

        let filtered = get_logs(
            &db,
            user.id,
            LogFilters {
                tag_ids: vec![tag_a.id, tag_b.id],
                ..Default::default()
            },
        )
        .await
        .unwrap();

        assert_eq!(filtered.len(), 1);
        assert_eq!(filtered[0].id, log2.id);

        let single_tag = get_logs(
            &db,
            user.id,
            LogFilters {
                tag_ids: vec![tag_a.id],
                ..Default::default()
            },
        )
        .await
        .unwrap();
        let ids: HashSet<_> = single_tag.into_iter().map(|log| log.id).collect();
        assert!(ids.contains(&log1.id));
        assert!(ids.contains(&log2.id));
    }
}
