use async_trait::async_trait;
use decopon_services::{usecases::users::User, ServiceError};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::{
    error::{IpcError, IpcResult},
    AppIpcState,
};

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ProfileResponse {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub work_time: i32,
    pub break_time: i32,
    pub locale: String,
}

impl From<User> for ProfileResponse {
    fn from(value: User) -> Self {
        Self {
            id: value.id,
            name: value.name,
            email: value.email,
            work_time: value.work_time,
            break_time: value.break_time,
            locale: value.locale,
        }
    }
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GetProfileRequest {
    pub user_id: i32,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProfileRequest {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePasswordRequest {
    pub current_password: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteProfileRequest {
    pub password: String,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProfileCommand {
    pub user_id: i32,
    pub request: UpdateProfileRequest,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePasswordCommand {
    pub user_id: i32,
    pub request: UpdatePasswordRequest,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteProfileCommand {
    pub user_id: i32,
    pub request: DeleteProfileRequest,
}

#[async_trait]
pub trait ProfileHandler: Send + Sync {
    async fn get_profile(&self, user_id: i32) -> Result<ProfileResponse, ServiceError>;
    async fn update_profile(
        &self,
        user_id: i32,
        request: UpdateProfileRequest,
    ) -> Result<ProfileResponse, ServiceError>;
    async fn update_profile_password(
        &self,
        user_id: i32,
        request: UpdatePasswordRequest,
    ) -> Result<(), ServiceError>;
    async fn delete_profile(
        &self,
        user_id: i32,
        request: DeleteProfileRequest,
    ) -> Result<(), ServiceError>;
}

async fn get_profile_internal(
    handler: &(dyn ProfileHandler + Send + Sync),
    user_id: i32,
) -> IpcResult<ProfileResponse> {
    handler.get_profile(user_id).await.map_err(IpcError::from)
}

async fn update_profile_internal(
    handler: &(dyn ProfileHandler + Send + Sync),
    user_id: i32,
    request: UpdateProfileRequest,
) -> IpcResult<ProfileResponse> {
    handler
        .update_profile(user_id, request)
        .await
        .map_err(IpcError::from)
}

async fn update_profile_password_internal(
    handler: &(dyn ProfileHandler + Send + Sync),
    user_id: i32,
    request: UpdatePasswordRequest,
) -> IpcResult<()> {
    handler
        .update_profile_password(user_id, request)
        .await
        .map_err(IpcError::from)
}

async fn delete_profile_internal(
    handler: &(dyn ProfileHandler + Send + Sync),
    user_id: i32,
    request: DeleteProfileRequest,
) -> IpcResult<()> {
    handler
        .delete_profile(user_id, request)
        .await
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn get_profile(
    services: State<'_, AppIpcState>,
    request: GetProfileRequest,
) -> IpcResult<ProfileResponse> {
    let handler: &dyn ProfileHandler = services.inner().as_ref();
    get_profile_internal(handler, request.user_id).await
}

#[tauri::command]
pub async fn update_profile(
    services: State<'_, AppIpcState>,
    command: UpdateProfileCommand,
) -> IpcResult<ProfileResponse> {
    let handler: &dyn ProfileHandler = services.inner().as_ref();
    update_profile_internal(handler, command.user_id, command.request).await
}

#[tauri::command]
pub async fn update_profile_password(
    services: State<'_, AppIpcState>,
    command: UpdatePasswordCommand,
) -> IpcResult<()> {
    let handler: &dyn ProfileHandler = services.inner().as_ref();
    update_profile_password_internal(handler, command.user_id, command.request).await
}

#[tauri::command]
pub async fn delete_profile(
    services: State<'_, AppIpcState>,
    command: DeleteProfileCommand,
) -> IpcResult<()> {
    let handler: &dyn ProfileHandler = services.inner().as_ref();
    delete_profile_internal(handler, command.user_id, command.request).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use decopon_services::ServiceError;
    use std::sync::Mutex;

    #[derive(Clone, Debug, PartialEq, Eq)]
    struct MockCall<T> {
        user_id: i32,
        payload: T,
    }

    struct MockProfileService {
        profile: ProfileResponse,
        get_calls: Mutex<Vec<i32>>,
        update_calls: Mutex<Vec<MockCall<UpdateProfileRequest>>>,
        password_calls: Mutex<Vec<MockCall<UpdatePasswordRequest>>>,
        delete_calls: Mutex<Vec<MockCall<DeleteProfileRequest>>>,
    }

    impl MockProfileService {
        fn new(profile: ProfileResponse) -> Self {
            Self {
                profile,
                get_calls: Mutex::new(Vec::new()),
                update_calls: Mutex::new(Vec::new()),
                password_calls: Mutex::new(Vec::new()),
                delete_calls: Mutex::new(Vec::new()),
            }
        }
    }

    #[async_trait]
    impl ProfileHandler for MockProfileService {
        async fn get_profile(&self, user_id: i32) -> Result<ProfileResponse, ServiceError> {
            self.get_calls.lock().unwrap().push(user_id);
            Ok(self.profile.clone())
        }

        async fn update_profile(
            &self,
            user_id: i32,
            request: UpdateProfileRequest,
        ) -> Result<ProfileResponse, ServiceError> {
            self.update_calls.lock().unwrap().push(MockCall {
                user_id,
                payload: request.clone(),
            });
            Ok(self.profile.clone())
        }

        async fn update_profile_password(
            &self,
            user_id: i32,
            request: UpdatePasswordRequest,
        ) -> Result<(), ServiceError> {
            self.password_calls.lock().unwrap().push(MockCall {
                user_id,
                payload: request.clone(),
            });
            Ok(())
        }

        async fn delete_profile(
            &self,
            user_id: i32,
            request: DeleteProfileRequest,
        ) -> Result<(), ServiceError> {
            self.delete_calls.lock().unwrap().push(MockCall {
                user_id,
                payload: request.clone(),
            });
            Ok(())
        }
    }

    #[test]
    fn get_profile_invokes_handler() {
        let profile = ProfileResponse {
            id: 1,
            name: "Test User".into(),
            email: "test@example.com".into(),
            work_time: 25,
            break_time: 5,
            locale: "ja".into(),
        };
        let service = MockProfileService::new(profile.clone());

        tauri::async_runtime::block_on(async {
            let result = get_profile_internal(&service, 10)
                .await
                .expect("should succeed");
            assert_eq!(result, profile);
        });

        assert_eq!(service.get_calls.lock().unwrap().as_slice(), &[10]);
    }

    #[test]
    fn update_profile_invokes_handler() {
        let profile = ProfileResponse {
            id: 1,
            name: "Test User".into(),
            email: "test@example.com".into(),
            work_time: 25,
            break_time: 5,
            locale: "ja".into(),
        };
        let service = MockProfileService::new(profile.clone());
        let request = UpdateProfileRequest {
            name: Some("New Name".into()),
            email: None,
        };
        let expected_request = request.clone();

        tauri::async_runtime::block_on(async {
            let result = update_profile_internal(&service, 10, request)
                .await
                .expect("should succeed");
            assert_eq!(result, profile);
        });

        let calls = service.update_calls.lock().unwrap();
        assert_eq!(calls.len(), 1);
        assert_eq!(calls[0].user_id, 10);
        assert_eq!(calls[0].payload, expected_request);
    }

    #[test]
    fn update_profile_password_invokes_handler() {
        let profile = ProfileResponse {
            id: 1,
            name: "Test User".into(),
            email: "test@example.com".into(),
            work_time: 25,
            break_time: 5,
            locale: "ja".into(),
        };
        let service = MockProfileService::new(profile);
        let request = UpdatePasswordRequest {
            current_password: "old".into(),
            password: "new".into(),
        };
        let expected_request = request.clone();

        tauri::async_runtime::block_on(async {
            update_profile_password_internal(&service, 10, request)
                .await
                .expect("should succeed");
        });

        let calls = service.password_calls.lock().unwrap();
        assert_eq!(calls.len(), 1);
        assert_eq!(calls[0].user_id, 10);
        assert_eq!(calls[0].payload, expected_request);
    }

    #[test]
    fn delete_profile_invokes_handler() {
        let profile = ProfileResponse {
            id: 1,
            name: "Test User".into(),
            email: "test@example.com".into(),
            work_time: 25,
            break_time: 5,
            locale: "ja".into(),
        };
        let service = MockProfileService::new(profile);
        let request = DeleteProfileRequest {
            password: "secret".into(),
        };
        let expected_request = request.clone();

        tauri::async_runtime::block_on(async {
            delete_profile_internal(&service, 10, request)
                .await
                .expect("should succeed");
        });

        let calls = service.delete_calls.lock().unwrap();
        assert_eq!(calls.len(), 1);
        assert_eq!(calls[0].user_id, 10);
        assert_eq!(calls[0].payload, expected_request);
    }
}
