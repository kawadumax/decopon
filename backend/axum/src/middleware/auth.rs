use axum::{
    body::Body,
    extract::State,
    http::{header::AUTHORIZATION, Request, StatusCode},
    middleware::Next,
    response::Response,
};

use crate::{
    usecases::auth::{decode_jwt, verify_jwt},
    AppState,
};

#[derive(Clone, Debug)]
pub struct AuthenticatedUser {
    pub id: i32,
    pub exp: usize,
}

/// ローカル（シングルユーザー）モードで JWT を要求せず固定ユーザーを注入するミドルウェア
pub async fn local_single_user_middleware(
    State(app_state): State<AppState>,
    mut req: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let session = app_state.single_user_session().ok_or(StatusCode::UNAUTHORIZED)?;
    let user = AuthenticatedUser {
        id: session.user.id,
        exp: usize::MAX,
    };
    req.extensions_mut().insert(user);
    Ok(next.run(req).await)
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
    let secret = app_state.jwt_secret().to_owned();

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
