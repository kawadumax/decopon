use crate::{
    entities::users,
    errors::ApiError,
    services::{self, users::User},
};
use axum_password_worker::{Bcrypt, BcryptConfig, PasswordWorker};
use chrono::Utc;
use jsonwebtoken::{EncodingKey, Header, encode};
use lettre::SmtpTransport;
use rand::{Rng, distributions::Alphanumeric};
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use sha2::{Digest, Sha256};
use std::sync::Arc;

// JWT claims構造体
#[derive(serde::Serialize, serde::Deserialize)]
pub struct Claims {
    sub: i32,   // user_id
    exp: usize, // 有効期限 (Unix timestamp)
}

pub struct RegisterUserResult {
    pub user: User,
}

pub struct AuthResponse {
    pub token: String,
    pub user: User,
}

pub async fn register_user(
    db: &DatabaseConnection,
    password_worker: &PasswordWorker<Bcrypt>,
    mailer: &Arc<SmtpTransport>,
    email: &str,
    password: &str,
) -> Result<RegisterUserResult, ApiError> {
    // ステップ1: ユニーク性検証（DBで既存ユーザー確認）
    // if let Some(_) = users::find()
    //     .filter(users::Column::Email.eq(email))
    //     .one(db)
    //     .await?
    // {
    //     return Err(AppError::ValidationError(
    //         "Email already exists".to_string(),
    //     ));
    // }

    let hashed_password = hash_password(password, password_worker).await?;
    let raw_token: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();
    let hashed_token = hash_token(&raw_token);
    let user_active = users::ActiveModel {
        email: Set(email.to_string()),
        password: Set(hashed_password),
        verification_token: Set(Some(hashed_token)),
        ..Default::default()
    };
    let user = user_active.insert(db).await?;
    services::mails::send_verification_email(mailer.clone(), email, &raw_token)?;

    Ok(RegisterUserResult { user: user.into() })
}

pub async fn get_auth_user_from_token(
    db: &DatabaseConnection,
    token: String,
) -> Result<User, ApiError> {
    // jwtを検証して、ユーザーIDを取得する必要があります。
    let claims = decode_jwt(token)?;
    if !verify_jwt(&claims)? {
        return Err(ApiError::Unauthorized);
    }
    let user_id = claims.sub;
    services::users::get_user_by_id(&db, user_id).await
}

pub async fn hash_password(
    password: &str,
    password_worker: &PasswordWorker<Bcrypt>,
) -> Result<String, ApiError> {
    let hashed_password = password_worker
        .hash(password, BcryptConfig { cost: 12 }) // costは調整可能
        .await?;
    Ok(hashed_password)
}

pub async fn login_user(
    db: &DatabaseConnection,
    password_worker: &PasswordWorker<Bcrypt>,
    email: &str,
    password: &str,
) -> Result<AuthResponse, ApiError> {
    // ユーザーをメールアドレスで取得
    let user_full = match services::users::get_user_by_email(db, &email.to_string()).await {
        Ok(u) => u,
        Err(ApiError::NotFound(_)) => return Err(ApiError::Unauthorized),
        Err(e) => return Err(e),
    };

    if user_full.email_verified_at.is_none() {
        return Err(ApiError::Unauthorized);
    }

    // パスワードを検証
    if !verify_password(password, &user_full.password, password_worker).await? {
        return Err(ApiError::Unauthorized);
    }

    // JWTトークンを生成
    let token = create_jwt(user_full.id)?;
    let user: User = user_full.into();

    Ok(AuthResponse { token, user })
}

pub async fn verify_email(
    db: &DatabaseConnection,
    token: String,
) -> Result<AuthResponse, ApiError> {
    let hashed = hash_token(&token);
    let user = users::Entity::find()
        .filter(users::Column::VerificationToken.eq(hashed.clone()))
        .one(db)
        .await?
        .ok_or_else(|| ApiError::BadRequest("Invalid token".into()))?;

    let mut user_active: users::ActiveModel = user.into();
    user_active.email_verified_at = Set(Some(Utc::now()));
    user_active.verification_token = Set(None);
    let user = user_active.update(db).await?;
    let jwt = create_jwt(user.id)?;
    Ok(AuthResponse {
        token: jwt,
        user: user.into(),
    })
}

pub async fn forgot_password(
    db: &DatabaseConnection,
    mailer: &Arc<SmtpTransport>,
    email: &str,
) -> Result<(), ApiError> {
    let user = users::Entity::find()
        .filter(users::Column::Email.eq(email))
        .one(db)
        .await?
        .ok_or(ApiError::NotFound("user"))?;

    let raw_token: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();
    let hashed = hash_token(&raw_token);
    let mut user_active: users::ActiveModel = user.into();
    user_active.verification_token = Set(Some(hashed));
    user_active.update(db).await?;

    let body = format!("Reset token: {}", raw_token);
    services::mails::send(mailer.clone(), email, "Reset your password", &body)?;
    Ok(())
}

pub async fn reset_password(
    db: &DatabaseConnection,
    password_worker: &PasswordWorker<Bcrypt>,
    token: &str,
    email: &str,
    password: &str,
) -> Result<(), ApiError> {
    let hashed = hash_token(token);
    let user = users::Entity::find()
        .filter(users::Column::Email.eq(email))
        .filter(users::Column::VerificationToken.eq(hashed))
        .one(db)
        .await?
        .ok_or(ApiError::BadRequest("Invalid token".into()))?;

    let hashed_password = hash_password(password, password_worker).await?;
    let mut user_active: users::ActiveModel = user.into();
    user_active.password = Set(hashed_password);
    user_active.verification_token = Set(None);
    user_active.update(db).await?;
    Ok(())
}

fn hash_token(token: &str) -> String {
    format!("{:x}", Sha256::digest(token.as_bytes()))
}

pub async fn verify_password(
    password: &str,
    hashed_password: &str,
    password_worker: &PasswordWorker<Bcrypt>,
) -> Result<bool, ApiError> {
    let is_valid = password_worker.verify(password, hashed_password).await?;
    Ok(is_valid)
}

pub fn create_jwt(user_id: i32) -> Result<String, ApiError> {
    let secret = std::env::var("JWT_SECRET")?; // JWTシークレットを環境変数から取得
    let claims = Claims {
        sub: user_id,
        exp: (Utc::now() + chrono::Duration::days(30)).timestamp() as usize, // 30日間有効
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )?;
    Ok(token)
}

pub fn decode_jwt(token: String) -> Result<Claims, ApiError> {
    let secret = std::env::var("JWT_SECRET")?;
    let token_data = jsonwebtoken::decode::<Claims>(
        &token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()),
        &jsonwebtoken::Validation::default(),
    )
    .map_err(|_| ApiError::Unauthorized)?;

    Ok(token_data.claims)
}

pub fn verify_jwt(claims: &Claims) -> Result<bool, ApiError> {
    // JWTの検証ロジックを実装
    Ok(claims.exp > Utc::now().timestamp() as usize)
}
