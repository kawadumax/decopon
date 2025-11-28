use std::{collections::HashMap, str::FromStr};

use axum::{
    body::{to_bytes, Body},
    http::{HeaderName, HeaderValue, Method, Request, Uri},
    response::Response,
    Router,
};
use decopon_axum::AppState;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use thiserror::Error;
use tower::ServiceExt;

#[derive(Clone)]
pub struct AppIpcState {
    router: Router,
}

impl AppIpcState {
    pub fn new(router: Router<AppState>, app_state: AppState) -> Self {
        Self {
            router: router.with_state(app_state),
        }
    }

    pub async fn call(&self, request: Request<Body>) -> Response {
        self
            .router
            .clone()
            .oneshot(request)
            .await
            .expect("router service should not fail")
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IpcHttpRequest {
    pub method: String,
    pub path: String,
    #[serde(default)]
    pub headers: HashMap<String, String>,
    #[serde(default)]
    pub body: Option<Value>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IpcHttpResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: Value,
}

#[derive(Debug, Error)]
enum IpcHttpError {
    #[error("HTTP メソッドが不正です: {0}")]
    InvalidMethod(String),
    #[error("パスが不正です: {0}")]
    InvalidPath(String),
    #[error("ヘッダー名が不正です: {0}")]
    InvalidHeaderName(String),
    #[error("ヘッダー値が不正です: {0}")]
    InvalidHeaderValue(String),
    #[error("リクエストボディのシリアライズに失敗しました: {0}")]
    SerializeBody(String),
    #[error("レスポンスボディの読み取りに失敗しました: {0}")]
    ReadBody(String),
}

impl From<IpcHttpError> for String {
    fn from(error: IpcHttpError) -> Self {
        error.to_string()
    }
}

pub async fn dispatch_http_request(
    state: &AppIpcState,
    method: String,
    path: String,
    body: Option<Value>,
    headers: Option<HashMap<String, String>>,
) -> Result<IpcHttpResponse, String> {
    let request = build_request(IpcHttpRequest {
        method,
        path,
        headers: headers.unwrap_or_default(),
        body,
    })?;

    let response = state.call(request).await;

    let status = response.status().as_u16();
    let mut response_headers = HashMap::new();
    for (name, value) in response.headers().iter() {
        if let Ok(value_str) = value.to_str() {
            response_headers.insert(name.to_string(), value_str.to_string());
        }
    }

    let body_bytes = to_bytes(response.into_body(), usize::MAX)
        .await
        .map_err(|error| IpcHttpError::ReadBody(error.to_string()))?;

    let body = if body_bytes.is_empty() {
        Value::Null
    } else {
        match serde_json::from_slice(&body_bytes) {
            Ok(value) => value,
            Err(_) => Value::String(String::from_utf8_lossy(&body_bytes).into()),
        }
    };

    Ok(IpcHttpResponse {
        status,
        headers: response_headers,
        body,
    })
}

fn build_request(payload: IpcHttpRequest) -> Result<Request<Body>, String> {
    let method = normalize_method(&payload.method)?;
    let uri = normalize_path(&payload.path)?;

    let body_bytes = match payload.body {
        None | Some(Value::Null) => Vec::new(),
        Some(Value::String(text)) => text.into_bytes(),
        Some(value) => serde_json::to_vec(&value)
            .map_err(|error| IpcHttpError::SerializeBody(error.to_string()))?,
    };

    let body = if body_bytes.is_empty() {
        Body::empty()
    } else {
        Body::from(body_bytes)
    };

    let mut request = Request::builder()
        .method(method)
        .uri(uri)
        .body(body)
        .map_err(|error| IpcHttpError::InvalidPath(error.to_string()))?;

    if !payload.headers.is_empty() {
        let headers = request.headers_mut();
        for (key, value) in payload.headers {
            let header_name = HeaderName::from_str(&key)
                .map_err(|_| IpcHttpError::InvalidHeaderName(key.clone()))?;
            let header_value = HeaderValue::from_str(&value)
                .map_err(|_| IpcHttpError::InvalidHeaderValue(key.clone()))?;
            headers.insert(header_name, header_value);
        }
    }

    Ok(request)
}

fn normalize_method(method: &str) -> Result<Method, String> {
    let normalized = method.trim().to_ascii_uppercase();
    Method::from_bytes(normalized.as_bytes())
        .map_err(|_| IpcHttpError::InvalidMethod(method.to_string()).into())
}

fn normalize_path(path: &str) -> Result<Uri, String> {
    let trimmed = path.trim();
    let normalized = if trimmed.starts_with('/') {
        trimmed.to_string()
    } else {
        format!("/{}", trimmed)
    };

    Uri::from_str(&normalized).map_err(|_| IpcHttpError::InvalidPath(path.to_string()).into())
}

