use async_trait::async_trait;
use chrono::{DateTime, Utc};
use decopon_services::{usecases::tags as tag_usecases, ServiceError};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::{
    error::{IpcError, IpcResult},
    AppIpcState,
};

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    pub id: i32,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub task_count: u64,
}

impl From<tag_usecases::Tag> for Tag {
    fn from(value: tag_usecases::Tag) -> Self {
        Self {
            id: value.id,
            name: value.name,
            created_at: value.created_at,
            updated_at: value.updated_at,
            task_count: value.task_count,
        }
    }
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ListTagsRequest {
    pub user_id: i32,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ListTagsResponse {
    pub tags: Vec<Tag>,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TagResponse {
    pub tag: Tag,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct OptionalTagResponse {
    pub tag: Option<Tag>,
}

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteTagsResponse {
    pub success: bool,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CreateTagRequest {
    pub user_id: i32,
    pub name: String,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TagRelationRequest {
    pub user_id: i32,
    pub task_id: i32,
    pub name: String,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteTagsRequest {
    pub user_id: i32,
    pub tag_ids: Vec<i32>,
}

#[async_trait]
pub trait TagHandler: Send + Sync {
    async fn list_tags(&self, request: ListTagsRequest) -> Result<Vec<Tag>, ServiceError>;
    async fn create_tag(&self, request: CreateTagRequest) -> Result<Tag, ServiceError>;
    async fn attach_tag_to_task(&self, request: TagRelationRequest) -> Result<Tag, ServiceError>;
    async fn detach_tag_from_task(
        &self,
        request: TagRelationRequest,
    ) -> Result<Option<Tag>, ServiceError>;
    async fn delete_tags(&self, request: DeleteTagsRequest) -> Result<(), ServiceError>;
}

async fn list_tags_internal(
    handler: &(dyn TagHandler + Send + Sync),
    request: ListTagsRequest,
) -> IpcResult<ListTagsResponse> {
    handler
        .list_tags(request)
        .await
        .map(|tags| ListTagsResponse { tags })
        .map_err(IpcError::from)
}

async fn create_tag_internal(
    handler: &(dyn TagHandler + Send + Sync),
    request: CreateTagRequest,
) -> IpcResult<TagResponse> {
    handler
        .create_tag(request)
        .await
        .map(|tag| TagResponse { tag })
        .map_err(IpcError::from)
}

async fn attach_tag_to_task_internal(
    handler: &(dyn TagHandler + Send + Sync),
    request: TagRelationRequest,
) -> IpcResult<TagResponse> {
    handler
        .attach_tag_to_task(request)
        .await
        .map(|tag| TagResponse { tag })
        .map_err(IpcError::from)
}

async fn detach_tag_from_task_internal(
    handler: &(dyn TagHandler + Send + Sync),
    request: TagRelationRequest,
) -> IpcResult<OptionalTagResponse> {
    handler
        .detach_tag_from_task(request)
        .await
        .map(|tag| OptionalTagResponse { tag })
        .map_err(IpcError::from)
}

async fn delete_tags_internal(
    handler: &(dyn TagHandler + Send + Sync),
    request: DeleteTagsRequest,
) -> IpcResult<DeleteTagsResponse> {
    handler
        .delete_tags(request)
        .await
        .map(|_| DeleteTagsResponse { success: true })
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn list_tags(
    services: State<'_, AppIpcState>,
    request: ListTagsRequest,
) -> IpcResult<ListTagsResponse> {
    let handler: &dyn TagHandler = services.inner().as_ref();
    list_tags_internal(handler, request).await
}

#[tauri::command]
pub async fn create_tag(
    services: State<'_, AppIpcState>,
    request: CreateTagRequest,
) -> IpcResult<TagResponse> {
    let handler: &dyn TagHandler = services.inner().as_ref();
    create_tag_internal(handler, request).await
}

#[tauri::command]
pub async fn attach_tag_to_task(
    services: State<'_, AppIpcState>,
    request: TagRelationRequest,
) -> IpcResult<TagResponse> {
    let handler: &dyn TagHandler = services.inner().as_ref();
    attach_tag_to_task_internal(handler, request).await
}

#[tauri::command]
pub async fn detach_tag_from_task(
    services: State<'_, AppIpcState>,
    request: TagRelationRequest,
) -> IpcResult<OptionalTagResponse> {
    let handler: &dyn TagHandler = services.inner().as_ref();
    detach_tag_from_task_internal(handler, request).await
}

#[tauri::command]
pub async fn delete_tags(
    services: State<'_, AppIpcState>,
    request: DeleteTagsRequest,
) -> IpcResult<DeleteTagsResponse> {
    let handler: &dyn TagHandler = services.inner().as_ref();
    delete_tags_internal(handler, request).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use chrono::Utc;
    use decopon_services::ServiceError;
    use std::sync::{
        atomic::{AtomicI32, Ordering},
        Mutex,
    };

    #[derive(Clone)]
    struct StoredTag {
        user_id: i32,
        tag: Tag,
    }

    struct MockTagService {
        tags: Mutex<Vec<StoredTag>>,
        attachments: Mutex<Vec<(i32, i32)>>,
        next_id: AtomicI32,
    }

    impl MockTagService {
        fn new() -> Self {
            Self {
                tags: Mutex::new(Vec::new()),
                attachments: Mutex::new(Vec::new()),
                next_id: AtomicI32::new(1),
            }
        }
    }

    #[async_trait]
    impl TagHandler for MockTagService {
        async fn list_tags(&self, request: ListTagsRequest) -> Result<Vec<Tag>, ServiceError> {
            let tags = self.tags.lock().unwrap();
            Ok(tags
                .iter()
                .filter(|stored| stored.user_id == request.user_id)
                .map(|stored| stored.tag.clone())
                .collect())
        }

        async fn create_tag(&self, request: CreateTagRequest) -> Result<Tag, ServiceError> {
            let mut tags = self.tags.lock().unwrap();
            let now = Utc::now();
            let id = self.next_id.fetch_add(1, Ordering::SeqCst);
            let tag = Tag {
                id,
                name: request.name,
                created_at: now,
                updated_at: now,
                task_count: 0,
            };
            tags.push(StoredTag {
                user_id: request.user_id,
                tag: tag.clone(),
            });
            Ok(tag)
        }

        async fn attach_tag_to_task(
            &self,
            request: TagRelationRequest,
        ) -> Result<Tag, ServiceError> {
            let now = Utc::now();
            let tag_id = {
                let tags = self.tags.lock().unwrap();
                tags.iter()
                    .find(|stored| {
                        stored.user_id == request.user_id && stored.tag.name == request.name
                    })
                    .map(|stored| stored.tag.id)
            }
            .unwrap_or_else(|| 0);

            let tag_id = if tag_id == 0 {
                self.create_tag(CreateTagRequest {
                    user_id: request.user_id,
                    name: request.name.clone(),
                })
                .await?
                .id
            } else {
                tag_id
            };

            let mut tags = self.tags.lock().unwrap();
            let stored = tags
                .iter_mut()
                .find(|stored| stored.user_id == request.user_id && stored.tag.id == tag_id)
                .unwrap();
            let mut attachments = self.attachments.lock().unwrap();

            if !attachments
                .iter()
                .any(|(task_id, tag_id)| *task_id == request.task_id && *tag_id == stored.tag.id)
            {
                attachments.push((request.task_id, stored.tag.id));
                stored.tag.task_count += 1;
            }
            stored.tag.updated_at = now;

            Ok(stored.tag.clone())
        }

        async fn detach_tag_from_task(
            &self,
            request: TagRelationRequest,
        ) -> Result<Option<Tag>, ServiceError> {
            let mut tags = self.tags.lock().unwrap();
            if let Some(stored) = tags
                .iter_mut()
                .find(|stored| stored.user_id == request.user_id && stored.tag.name == request.name)
            {
                let mut attachments = self.attachments.lock().unwrap();
                if let Some(position) = attachments.iter().position(|(task_id, tag_id)| {
                    *task_id == request.task_id && *tag_id == stored.tag.id
                }) {
                    attachments.remove(position);
                    if stored.tag.task_count > 0 {
                        stored.tag.task_count -= 1;
                    }
                    stored.tag.updated_at = Utc::now();
                }
                return Ok(Some(stored.tag.clone()));
            }
            Ok(None)
        }

        async fn delete_tags(&self, request: DeleteTagsRequest) -> Result<(), ServiceError> {
            let mut tags = self.tags.lock().unwrap();
            let mut attachments = self.attachments.lock().unwrap();
            let mut removed_ids = Vec::new();

            tags.retain(|stored| {
                if stored.user_id == request.user_id && request.tag_ids.contains(&stored.tag.id) {
                    removed_ids.push(stored.tag.id);
                    false
                } else {
                    true
                }
            });

            attachments.retain(|(_, tag_id)| !removed_ids.contains(tag_id));
            Ok(())
        }
    }

    #[test]
    fn tag_flow() {
        let handler = MockTagService::new();

        tauri::async_runtime::block_on(async {
            let created = create_tag_internal(
                &handler,
                CreateTagRequest {
                    user_id: 1,
                    name: "Work".into(),
                },
            )
            .await
            .unwrap()
            .tag;

            assert_eq!(created.id, 1);
            assert_eq!(created.name, "Work");
            assert_eq!(created.task_count, 0);

            let attached = attach_tag_to_task_internal(
                &handler,
                TagRelationRequest {
                    user_id: 1,
                    task_id: 10,
                    name: "Work".into(),
                },
            )
            .await
            .unwrap()
            .tag;

            assert_eq!(attached.task_count, 1);

            let detached = detach_tag_from_task_internal(
                &handler,
                TagRelationRequest {
                    user_id: 1,
                    task_id: 10,
                    name: "Work".into(),
                },
            )
            .await
            .unwrap()
            .tag
            .unwrap();

            assert_eq!(detached.task_count, 0);

            let delete_response = delete_tags_internal(
                &handler,
                DeleteTagsRequest {
                    user_id: 1,
                    tag_ids: vec![created.id],
                },
            )
            .await
            .unwrap();

            assert!(delete_response.success);

            let remaining = list_tags_internal(&handler, ListTagsRequest { user_id: 1 })
                .await
                .unwrap();

            assert!(remaining.tags.is_empty());
        });
    }
}
