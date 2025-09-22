use axum::{
    body::Body,
    extract::State,
    http::{Request, StatusCode, header::AUTHORIZATION},
    middleware::Next,
    response::Response,
};

use crate::{
    AppState,
    services::auth::{decode_jwt, verify_jwt},
};

#[derive(Clone, Debug)]
pub struct AuthenticatedUser {
    pub id: i32,
    pub exp: usize,
}

pub async fn auth_middleware(
    State(app_state): State<AppState>,
    mut req: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    // AuthorizationヘッダからBearerトークンを取得
    let token = req
        .headers()
        .get(AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .map(|s| s.to_string())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // AppStateからシークレットを取得
    let secret = app_state.jwt_secret.clone();

    // JWTをデコード
    let claims = decode_jwt(token, &secret).map_err(|_| StatusCode::UNAUTHORIZED)?;
    if !verify_jwt(&claims).map_err(|_| StatusCode::UNAUTHORIZED)? {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let user = AuthenticatedUser {
        id: claims.sub,
        exp: claims.exp,
    };

    // 認証済みユーザー情報をリクエストに保存
    req.extensions_mut().insert(user);

    // 次のハンドラへ
    Ok(next.run(req).await)
}
