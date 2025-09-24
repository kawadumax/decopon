use crate::services::AppServices;
use decopon_app_ipc as ipc;
use decopon_app_ipc::{
    auth::AuthLoginResponse,
    error::IpcError,
    tasks::{DeleteTaskResponse, TaskResponse, TasksResponse},
};
use serde_json::json;
use tauri::{
    ipc::{CallbackFn, InvokeBody},
    test::{self, mock_context, noop_assets, INVOKE_KEY},
    webview::InvokeRequest,
    WebviewWindowBuilder,
};

fn invoke_request(cmd: &str, body: serde_json::Value) -> InvokeRequest {
    InvokeRequest {
        cmd: cmd.into(),
        callback: CallbackFn(0),
        error: CallbackFn(1),
        url: "http://tauri.localhost".parse().unwrap(),
        body: InvokeBody::from(body),
        headers: Default::default(),
        invoke_key: INVOKE_KEY.to_string(),
    }
}

fn build_test_app(services: AppServices) -> tauri::App<tauri::test::MockRuntime> {
    let builder = test::mock_builder().manage(services);
    ipc::register(builder)
        .build(mock_context(noop_assets()))
        .expect("failed to build test app")
}

#[test]
fn smoke_test_auth_and_task_commands() {
    std::env::set_var("APP_SINGLE_USER_MODE", "1");
    std::env::set_var("APP_SINGLE_USER_EMAIL", "smoke@example.com");
    std::env::set_var("APP_SINGLE_USER_PASSWORD", "password");
    std::env::set_var("APP_SINGLE_USER_NAME", "Smoke Test");
    std::env::set_var("APP_SINGLE_USER_LOCALE", "ja");
    std::env::set_var("APP_SINGLE_USER_WORK_TIME", "50");
    std::env::set_var("APP_SINGLE_USER_BREAK_TIME", "10");

    let services = tauri::async_runtime::block_on(AppServices::initialize(
        "sqlite::memory:",
        "test-secret".into(),
        true,
    ))
    .expect("service initialization should succeed");

    let app = build_test_app(services);
    let webview = WebviewWindowBuilder::new(&app, "main", Default::default())
        .build()
        .expect("failed to build webview");

    let login_body = json!({
        "request": {
            "email": "smoke@example.com",
            "password": "password"
        }
    });

    let login_response = test::get_ipc_response(&webview, invoke_request("login", login_body))
        .expect("login command should succeed")
        .deserialize::<AuthLoginResponse>()
        .expect("failed to deserialize login response");

    assert_eq!(login_response.session.user.email, "smoke@example.com");
    assert_eq!(login_response.session.user.name, "Smoke Test");

    let user_id = login_response.session.user.id;

    let failed_login_body = json!({
        "request": {
            "email": "smoke@example.com",
            "password": "wrong"
        }
    });

    let login_error = test::get_ipc_response(&webview, invoke_request("login", failed_login_body))
        .expect_err("login should fail with invalid password");

    let login_error: IpcError = serde_json::from_value(login_error).expect("error payload");
    assert_eq!(login_error.code, "auth.unauthorized");

    let create_body = json!({
        "request": {
            "userId": user_id,
            "title": "Write integration test",
            "description": "Cover IPC smoke scenario"
        }
    });

    let created = test::get_ipc_response(&webview, invoke_request("create_task", create_body))
        .expect("create task should succeed")
        .deserialize::<TaskResponse>()
        .expect("failed to deserialize create response");

    assert_eq!(created.task.title, "Write integration test");
    assert_eq!(created.task.description, "Cover IPC smoke scenario");
    assert!(!created.task.completed);

    let list_response = test::get_ipc_response(
        &webview,
        invoke_request(
            "list_tasks",
            json!({
                "request": {
                    "userId": user_id
                }
            }),
        ),
    )
    .expect("list tasks should succeed")
    .deserialize::<TasksResponse>()
    .expect("failed to deserialize list response");

    assert_eq!(list_response.tasks.len(), 1);

    let update_body = json!({
        "request": {
            "id": created.task.id,
            "userId": user_id,
            "title": "Update integration test",
            "completed": true
        }
    });

    let updated = test::get_ipc_response(&webview, invoke_request("update_task", update_body))
        .expect("update task should succeed")
        .deserialize::<TaskResponse>()
        .expect("failed to deserialize update response");

    assert_eq!(updated.task.title, "Update integration test");
    assert!(updated.task.completed);

    let delete_body = json!({
        "request": {
            "id": updated.task.id,
            "userId": user_id
        }
    });

    let delete_response =
        test::get_ipc_response(&webview, invoke_request("delete_task", delete_body))
            .expect("delete task should succeed")
            .deserialize::<DeleteTaskResponse>()
            .expect("failed to deserialize delete response");

    assert!(delete_response.success);

    let empty_list = test::get_ipc_response(
        &webview,
        invoke_request(
            "list_tasks",
            json!({
                "request": {
                    "userId": user_id
                }
            }),
        ),
    )
    .expect("list tasks after deletion should succeed")
    .deserialize::<TasksResponse>()
    .expect("failed to deserialize empty list response");

    assert!(empty_list.tasks.is_empty());
}
