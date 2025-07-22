use crate::{
    entities::{prelude::*, users},
    routes::auth::{LoginRequestDto, LoginResultDto, RegisterUserResultDto, UserDto},
    services,
};
use axum_password_worker::{Bcrypt, BcryptConfig, PasswordWorker};
use chrono::Utc;
use jsonwebtoken::{EncodingKey, Header, encode};
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};

type AppError = Box<dyn std::error::Error + Send + Sync>;

// JWT claims構造体
#[derive(serde::Serialize, serde::Deserialize)]
pub struct Claims {
    sub: i32,   // user_id
    exp: usize, // 有効期限 (Unix timestamp)
}

pub async fn register_user(
    db: &DatabaseConnection,
    password_worker: &PasswordWorker<Bcrypt>,
    email: &str,
    password: &str,
) -> Result<RegisterUserResultDto, AppError> {
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

    // ステップ2: パスワードハッシュ & ユーザー作成
    let hashed_password = hash_password(password, password_worker).await?; // argon2でハッシュ
    let user_active = users::ActiveModel {
        email: Set(email.to_string()),
        password: Set(hashed_password),
        ..Default::default()
    };
    let user = user_active.insert(db).await?;

    // ステップ3: JWT生成
    let token = create_jwt(user.id).map_err(|e| AppError::from(e))?;

    Ok(RegisterUserResultDto {
        user: user.into(),
        token,
    })
}

pub async fn get_auth_user_from_token(
    db: &DatabaseConnection,
    token: String,
) -> Result<UserDto, AppError> {
    // jwtを検証して、ユーザーIDを取得する必要があります。
    let claims = decode_jwt(token)?;
    if !verify_jwt(&claims)? {
        return Err(AppError::from("Invalid JWT token"));
    }
    let user_id = claims.sub;
    services::users::get_user_by_id(&db, user_id)
        .await
        .map_err(|e| AppError::from(e))
}

pub async fn hash_password(
    password: &str,
    password_worker: &PasswordWorker<Bcrypt>,
) -> Result<String, AppError> {
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
) -> Result<LoginResultDto, AppError> {
    // ユーザーをメールアドレスで取得
    let user = services::users::get_user_by_email(db, &email.to_string())
        .await
        .map_err(|e| AppError::from(e))?;

    // パスワードを検証
    if !verify_password(password, &user.password, password_worker).await? {
        return Err(AppError::from("Invalid email or password"));
    }

    // JWTトークンを生成
    let token = create_jwt(user.id).map_err(|e| AppError::from(e))?;

    Ok(LoginResultDto {
        token,
        user: user.into(),
    })
}

pub async fn verify_password(
    password: &str,
    hashed_password: &str,
    password_worker: &PasswordWorker<Bcrypt>,
) -> Result<bool, AppError> {
    let is_valid = password_worker.verify(password, hashed_password).await?;
    Ok(is_valid)
}

pub fn create_jwt(user_id: i32) -> Result<String, AppError> {
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

pub fn decode_jwt(token: String) -> Result<Claims, AppError> {
    let secret = std::env::var("JWT_SECRET")?;
    let token_data = jsonwebtoken::decode::<Claims>(
        &token,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()),
        &jsonwebtoken::Validation::default(),
    )?;

    Ok(token_data.claims)
}

pub fn verify_jwt(claims: &Claims) -> Result<bool, AppError> {
    // JWTの検証ロジックを実装
    Ok(claims.exp > Utc::now().timestamp() as usize)
}
