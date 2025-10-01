use async_trait::async_trait;
use decopon_services::{usecases::users::User, ServiceError};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::{
    error::{IpcError, IpcResult},
    AppIpcState,
};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PreferenceResponse {
    pub work_time: i32,
    pub break_time: i32,
    pub locale: String,
}

impl From<User> for PreferenceResponse {
    fn from(user: User) -> Self {
        Self {
            work_time: user.work_time,
            break_time: user.break_time,
            locale: user.locale,
        }
    }
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePreferenceRequest {
    pub work_time: i32,
    pub break_time: i32,
    pub locale: String,
}

#[derive(Debug, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePreferenceCommand {
    pub user_id: i32,
    pub request: UpdatePreferenceRequest,
}

#[async_trait]
pub trait PreferenceHandler: Send + Sync {
    async fn update_preferences(
        &self,
        user_id: i32,
        request: UpdatePreferenceRequest,
    ) -> Result<PreferenceResponse, ServiceError>;
}

async fn update_preferences_internal(
    handler: &(dyn PreferenceHandler + Send + Sync),
    user_id: i32,
    request: UpdatePreferenceRequest,
) -> IpcResult<PreferenceResponse> {
    handler
        .update_preferences(user_id, request)
        .await
        .map_err(IpcError::from)
}

#[tauri::command]
pub async fn update_preferences(
    services: State<'_, AppIpcState>,
    command: UpdatePreferenceCommand,
) -> IpcResult<PreferenceResponse> {
    let handler: &dyn PreferenceHandler = services.inner().as_ref();
    update_preferences_internal(handler, command.user_id, command.request).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    use async_trait::async_trait;
    use decopon_services::ServiceError;

    struct MockPreferenceService {
        response: PreferenceResponse,
        last_call: Mutex<Option<(i32, UpdatePreferenceRequest)>>,
    }

    #[async_trait]
    impl PreferenceHandler for MockPreferenceService {
        async fn update_preferences(
            &self,
            user_id: i32,
            request: UpdatePreferenceRequest,
        ) -> Result<PreferenceResponse, ServiceError> {
            *self.last_call.lock().unwrap() = Some((user_id, request.clone()));
            Ok(self.response.clone())
        }
    }

    #[test]
    fn update_preferences_invokes_handler() {
        let handler = MockPreferenceService {
            response: PreferenceResponse {
                work_time: 30,
                break_time: 10,
                locale: "en".into(),
            },
            last_call: Mutex::new(None),
        };

        let user_id = 42;
        let request = UpdatePreferenceRequest {
            work_time: 25,
            break_time: 5,
            locale: "ja".into(),
        };
        let expected_request = request.clone();
        let expected_response = handler.response.clone();

        tauri::async_runtime::block_on(async {
            let response = super::update_preferences_internal(&handler, user_id, request.clone())
                .await
                .expect("handler should succeed");
            assert_eq!(response, expected_response);
        });

        let call = handler
            .last_call
            .lock()
            .unwrap()
            .clone()
            .expect("handler should be called");
        assert_eq!(call.0, user_id);
        assert_eq!(call.1, expected_request);
    }
}
