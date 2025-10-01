use crate::services::AppServices;
use decopon_app_ipc as ipc;
use decopon_app_ipc::{
    auth::AuthLoginResponse,
    error::IpcError,
    tasks::{DeleteTaskResponse, TaskResponse, TasksResponse},
    AppIpcState, AuthCurrentUserResponse, AuthRegisterResponse, AuthStatusResponse,
    PreferenceResponse,
};
use decopon_services::entities::users;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::sync::Arc;
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
    let handler: AppIpcState = Arc::new(services);
    let builder = test::mock_builder().manage(handler);
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

    let app = build_test_app(services.clone());
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

    let get_body = json!({
        "request": {
            "id": created.task.id,
            "userId": user_id
        }
    });

    let fetched = test::get_ipc_response(&webview, invoke_request("get_task", get_body))
        .expect("get task should succeed")
        .deserialize::<TaskResponse>()
        .expect("failed to deserialize get response");

    assert_eq!(fetched.task.id, created.task.id);
    assert_eq!(fetched.task.title, created.task.title);

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

#[test]
fn smoke_test_registration_and_password_flow() {
    let services = tauri::async_runtime::block_on(AppServices::initialize(
        "sqlite::memory:",
        "password-secret".into(),
        false,
    ))
    .expect("service initialization should succeed");

    let app = build_test_app(services.clone());
    let webview = WebviewWindowBuilder::new(&app, "auth", Default::default())
        .build()
        .expect("failed to build webview");

    let email = "flow@example.com";

    let register_body = json!({
        "request": {
            "name": "Flow User",
            "email": email,
            "password": "initial-pass",
            "passwordConfirmation": "initial-pass"
        }
    });

    let register_response =
        test::get_ipc_response(&webview, invoke_request("register", register_body))
            .expect("register command should succeed")
            .deserialize::<AuthRegisterResponse>()
            .expect("failed to deserialize register response");

    assert_eq!(register_response.user.email, email);

    let login_body = json!({
        "request": {
            "email": "flow@example.com",
            "password": "initial-pass"
        }
    });

    let login_response = test::get_ipc_response(&webview, invoke_request("login", login_body))
        .expect("login command should succeed")
        .deserialize::<AuthLoginResponse>()
        .expect("failed to deserialize login response");

    let current_user_body = json!({
        "request": {
            "token": login_response.session.token
        }
    });

    let current_user_response =
        test::get_ipc_response(&webview, invoke_request("current_user", current_user_body))
            .expect("current_user command should succeed")
            .deserialize::<AuthCurrentUserResponse>()
            .expect("failed to deserialize current_user response");

    assert_eq!(current_user_response.user.email, email);

    let confirm_body = json!({
        "token": login_response.session.token,
        "request": {
            "password": "initial-pass"
        }
    });

    let confirm_response =
        test::get_ipc_response(&webview, invoke_request("confirm_password", confirm_body))
            .expect("confirm_password command should succeed")
            .deserialize::<AuthStatusResponse>()
            .expect("failed to deserialize confirm_password response");

    assert_eq!(confirm_response.status, "password-confirmed");

    let forgot_body = json!({
        "request": {
            "email": email
        }
    });

    let forgot_response =
        test::get_ipc_response(&webview, invoke_request("forgot_password", forgot_body))
            .expect("forgot_password command should succeed")
            .deserialize::<AuthStatusResponse>()
            .expect("failed to deserialize forgot_password response");

    assert_eq!(forgot_response.status, "password-reset-link-sent");

    let reset_token = "reset-token";
    let hashed_token = format!("{:x}", Sha256::digest(reset_token.as_bytes()));

    tauri::async_runtime::block_on(async {
        let db = services.context().db();
        let user = users::Entity::find()
            .filter(users::Column::Email.eq(email))
            .one(db)
            .await
            .expect("query user")
            .expect("user should exist");

        let mut active: users::ActiveModel = user.into();
        active.verification_token = Set(Some(hashed_token));
        active.update(db).await.expect("update verification token");
    });

    let reset_body = json!({
        "request": {
            "token": reset_token,
            "email": email,
            "password": "new-pass"
        }
    });

    let reset_response =
        test::get_ipc_response(&webview, invoke_request("reset_password", reset_body))
            .expect("reset_password command should succeed")
            .deserialize::<AuthStatusResponse>()
            .expect("failed to deserialize reset_password response");

    assert_eq!(reset_response.status, "password-reset");

    let login_after_reset_body = json!({
        "request": {
            "email": email,
            "password": "new-pass"
        }
    });

    let login_after_reset =
        test::get_ipc_response(&webview, invoke_request("login", login_after_reset_body))
            .expect("login after reset should succeed")
            .deserialize::<AuthLoginResponse>()
            .expect("failed to deserialize login after reset response");

    assert_eq!(login_after_reset.session.user.email, email);

    let logout_response = test::get_ipc_response(&webview, invoke_request("logout", json!({})))
        .expect("logout command should succeed")
        .deserialize::<AuthStatusResponse>()
        .expect("failed to deserialize logout response");

    assert_eq!(logout_response.status, "logged-out");
}

#[test]
fn smoke_test_email_verification_flow() {
    let services = tauri::async_runtime::block_on(AppServices::initialize(
        "sqlite::memory:",
        "email-secret".into(),
        false,
    ))
    .expect("service initialization should succeed");

    let app = build_test_app(services.clone());
    let webview = WebviewWindowBuilder::new(&app, "verify", Default::default())
        .build()
        .expect("failed to build webview");

    let email = "verify@example.com";
    let token = "verify-token";

    let register_body = json!({
        "request": {
            "name": "Verify User",
            "email": email,
            "password": "initial-pass",
            "passwordConfirmation": "initial-pass"
        }
    });

    test::get_ipc_response(&webview, invoke_request("register", register_body))
        .expect("register command should succeed")
        .deserialize::<AuthRegisterResponse>()
        .expect("failed to deserialize register response");

    let hashed_token = format!("{:x}", Sha256::digest(token.as_bytes()));

    tauri::async_runtime::block_on(async {
        let db = services.context().db();
        let user = users::Entity::find()
            .filter(users::Column::Email.eq(email))
            .one(db)
            .await
            .expect("query user")
            .expect("user should exist");

        let mut active: users::ActiveModel = user.into();
        active.email_verified_at = Set(None);
        active.verification_token = Set(Some(hashed_token.clone()));
        active.update(db).await.expect("update user");
    });

    let resend_body = json!({
        "request": {
            "email": email
        }
    });

    let resend_response =
        test::get_ipc_response(&webview, invoke_request("resend_verification", resend_body))
            .expect("resend_verification command should succeed")
            .deserialize::<AuthStatusResponse>()
            .expect("failed to deserialize resend response");

    assert_eq!(resend_response.status, "verification-link-sent");

    let hashed_token = format!("{:x}", Sha256::digest(token.as_bytes()));

    tauri::async_runtime::block_on(async {
        let db = services.context().db();
        let user = users::Entity::find()
            .filter(users::Column::Email.eq(email))
            .one(db)
            .await
            .expect("query user")
            .expect("user should exist");

        let mut active: users::ActiveModel = user.into();
        active.verification_token = Set(Some(hashed_token.clone()));
        active.update(db).await.expect("restore token");
    });

    let verify_body = json!({
        "request": {
            "token": token
        }
    });

    let verify_response =
        test::get_ipc_response(&webview, invoke_request("verify_email", verify_body))
            .expect("verify_email command should succeed")
            .deserialize::<AuthLoginResponse>()
            .expect("failed to deserialize verify_email response");

    assert_eq!(verify_response.session.user.email, email);

    tauri::async_runtime::block_on(async {
        let db = services.context().db();
        let user = users::Entity::find()
            .filter(users::Column::Email.eq(email))
            .one(db)
            .await
            .expect("query user")
            .expect("user should exist");

        assert!(user.email_verified_at.is_some());
    });
}

#[test]
fn update_preferences_command_updates_user_settings() {
    std::env::set_var("APP_SINGLE_USER_MODE", "1");
    std::env::set_var("APP_SINGLE_USER_EMAIL", "prefs@example.com");
    std::env::set_var("APP_SINGLE_USER_PASSWORD", "password");
    std::env::set_var("APP_SINGLE_USER_NAME", "Preference User");
    std::env::set_var("APP_SINGLE_USER_LOCALE", "ja");
    std::env::set_var("APP_SINGLE_USER_WORK_TIME", "25");
    std::env::set_var("APP_SINGLE_USER_BREAK_TIME", "5");

    let services = tauri::async_runtime::block_on(AppServices::initialize(
        "sqlite::memory:",
        "preferences-secret".into(),
        true,
    ))
    .expect("service initialization should succeed");

    let app = build_test_app(services.clone());
    let webview = WebviewWindowBuilder::new(&app, "preferences", Default::default())
        .build()
        .expect("failed to build webview");

    let session =
        test::get_ipc_response(&webview, invoke_request("single_user_session", json!({})))
            .expect("single_user_session command should succeed")
            .deserialize::<AuthLoginResponse>()
            .expect("failed to deserialize single_user_session response");

    let user_id = session.session.user.id;

    let update_body = json!({
        "userId": user_id,
        "request": {
            "workTime": 40,
            "breakTime": 20,
            "locale": "en"
        }
    });

    let response =
        test::get_ipc_response(&webview, invoke_request("update_preferences", update_body))
            .expect("update_preferences command should succeed")
            .deserialize::<PreferenceResponse>()
            .expect("failed to deserialize update_preferences response");

    assert_eq!(response.work_time, 40);
    assert_eq!(response.break_time, 20);
    assert_eq!(response.locale, "en");

    tauri::async_runtime::block_on(async {
        let db = services.context().db();
        let user = users::Entity::find_by_id(user_id)
            .one(db)
            .await
            .expect("query user by id")
            .expect("user should exist");

        assert_eq!(user.work_time, 40);
        assert_eq!(user.break_time, 20);
        assert_eq!(user.locale, "en");
    });
}
