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
    pub sub: i32,   // user_id
    pub exp: usize, // 有効期限 (Unix timestamp)
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
    name: &str,
    email: &str,
    password: &str,
) -> Result<RegisterUserResult, ApiError> {
    // ステップ1: ユニーク性検証（DBで既存ユーザー確認）
    if users::Entity::find()
        .filter(users::Column::Email.eq(email))
        .one(db)
        .await?
        .is_some()
    {
        return Err(ApiError::Conflict("user"));
    }

    let hashed_password = hash_password(password, password_worker).await?;
    let raw_token: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();
    let hashed_token = hash_token(&raw_token);
    let user_active = users::ActiveModel {
        name: Set(name.to_string()),
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
    jwt_secret: &str,
) -> Result<User, ApiError> {
    // jwtを検証して、ユーザーIDを取得する必要があります。
    let claims = decode_jwt(token, jwt_secret)?;
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
    jwt_secret: &str,
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
    let token = create_jwt(user_full.id, jwt_secret)?;
    let user: User = user_full.into();

    Ok(AuthResponse { token, user })
}

#[tracing::instrument(skip(db, jwt_secret, token))]
pub async fn verify_email(
    db: &DatabaseConnection,
    token: String,
    jwt_secret: &str,
) -> Result<AuthResponse, ApiError> {
    let hashed = hash_token(&token);
    tracing::trace!(%hashed, "hashed verification token");

    let user = users::Entity::find()
        .filter(users::Column::VerificationToken.eq(hashed.clone()))
        .one(db)
        .await?
        .ok_or_else(|| ApiError::BadRequest("Invalid token".into()))?;

    let mut user_active: users::ActiveModel = user.into();
    user_active.email_verified_at = Set(Some(Utc::now()));
    user_active.verification_token = Set(None);
    let user = user_active.update(db).await?;

    tracing::info!(user_id = user.id, "creating JWT");
    let jwt = create_jwt(user.id, jwt_secret).map_err(|e| {
        tracing::error!(error = %e, user_id = user.id, "failed to create JWT");
        ApiError::Internal(Box::new(e))
    })?;
    tracing::info!(user_id = user.id, "JWT created");

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

pub async fn confirm_password(
    db: &DatabaseConnection,
    password_worker: &PasswordWorker<Bcrypt>,
    jwt_secret: &str,
    token: &str,
    password: &str,
) -> Result<(), ApiError> {
    let claims = decode_jwt(token.to_string(), jwt_secret)?;
    if !verify_jwt(&claims)? {
        return Err(ApiError::Unauthorized);
    }

    let user = users::Entity::find_by_id(claims.sub)
        .one(db)
        .await?
        .ok_or(ApiError::Unauthorized)?;

    let is_valid = verify_password(password, &user.password, password_worker).await?;
    if !is_valid {
        return Err(ApiError::Unauthorized);
    }

    Ok(())
}

pub async fn resend_verification(
    db: &DatabaseConnection,
    mailer: &Arc<SmtpTransport>,
    email: &str,
) -> Result<(), ApiError> {
    let user = users::Entity::find()
        .filter(users::Column::Email.eq(email))
        .one(db)
        .await?
        .ok_or(ApiError::NotFound("user"))?;

    if user.email_verified_at.is_some() {
        return Err(ApiError::BadRequest("Email already verified".into()));
    }

    let raw_token: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();
    let hashed = hash_token(&raw_token);

    let mut user_active: users::ActiveModel = user.into();
    user_active.verification_token = Set(Some(hashed));
    let user = user_active.update(db).await?;

    services::mails::send_verification_email(mailer.clone(), &user.email, &raw_token)?;

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

pub fn create_jwt(user_id: i32, secret: &str) -> Result<String, ApiError> {
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

pub fn decode_jwt(token: String, secret: &str) -> Result<Claims, ApiError> {
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

#[cfg(test)]
mod auth_tests {
    use super::*;
    use axum_password_worker::PasswordWorker;
    use chrono::Utc;
    use jsonwebtoken::{EncodingKey, Header};

    #[tokio::test]
    async fn hash_password_and_verify_success() {
        let worker = PasswordWorker::new_bcrypt(4).unwrap();
        let password = "secret";
        let hashed = hash_password(password, &worker).await.unwrap();
        assert_ne!(password, hashed);
        assert!(verify_password(password, &hashed, &worker).await.unwrap());
    }

    #[tokio::test]
    async fn verify_password_mismatch() {
        let worker = PasswordWorker::new_bcrypt(4).unwrap();
        let hashed = hash_password("secret", &worker).await.unwrap();
        assert!(!verify_password("wrong", &hashed, &worker).await.unwrap());
    }

    #[test]
    fn create_and_decode_jwt_success() {
        let secret = "secret";
        let token = create_jwt(1, secret).unwrap();
        let claims = decode_jwt(token, secret).unwrap();
        assert_eq!(claims.sub, 1);
        assert!(verify_jwt(&claims).unwrap());
    }

    #[test]
    fn verify_jwt_expired() {
        let secret = "secret";
        let expired_claims = Claims {
            sub: 1,
            exp: (Utc::now() - chrono::Duration::seconds(1)).timestamp() as usize,
        };
        let token = jsonwebtoken::encode(
            &Header::default(),
            &expired_claims,
            &EncodingKey::from_secret(secret.as_ref()),
        )
        .unwrap();
        let claims = decode_jwt(token, secret).unwrap();
        assert!(!verify_jwt(&claims).unwrap());
    }

    #[test]
    fn decode_jwt_invalid_secret() {
        let token = create_jwt(1, "secret").unwrap();
        let res = decode_jwt(token, "wrong");
        assert!(matches!(res, Err(ApiError::Unauthorized)));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use migration::{Migrator, MigratorTrait};
    use sea_orm::{ActiveModelTrait, Database, Set};
    use std::process::{Child, Command};
    use std::sync::Arc;
    use tokio::time::{Duration, sleep};

    async fn setup(
        port: u16,
    ) -> (
        DatabaseConnection,
        PasswordWorker<Bcrypt>,
        Arc<SmtpTransport>,
        Child,
    ) {
        // 環境変数設定（メール送信元）
        unsafe {
            std::env::set_var("AXUM_MAIL_FROM_EMAIL", "from@example.com");
        }

        // SMTPデバッグサーバ起動
        let child = Command::new("python")
            .args([
                "-m",
                "smtpd",
                "-c",
                "DebuggingServer",
                "-n",
                &format!("127.0.0.1:{}", port),
            ])
            .spawn()
            .expect("failed to start smtp server");
        // サーバ起動待ち
        // サーバ起動に時間がかかる環境があるため待ち時間を延長
        sleep(Duration::from_millis(500)).await;

        let mailer = Arc::new(
            SmtpTransport::builder_dangerous("127.0.0.1")
                .port(port)
                .build(),
        );

        let password_worker = PasswordWorker::new_bcrypt(4).unwrap();

        // メモリDBを作成しマイグレーション
        let db = Database::connect("sqlite::memory:")
            .await
            .expect("connect db");
        Migrator::up(&db, None).await.expect("run migrations");

        (db, password_worker, mailer, child)
    }

    #[tokio::test]
    async fn register_user_success() {
        let (db, pw, mailer, mut child) = setup(2525).await;

        let res = register_user(&db, &pw, &mailer, "Alice", "user@example.com", "password").await;
        assert_eq!(res.unwrap().user.name, "Alice");

        child.kill().ok();
    }

    #[tokio::test]
    async fn register_user_conflict() {
        let (db, pw, mailer, mut child) = setup(2626).await;

        register_user(&db, &pw, &mailer, "Bob", "user@example.com", "password")
            .await
            .expect("initial insert");

        let res = register_user(&db, &pw, &mailer, "Tom", "user@example.com", "password").await;
        assert!(matches!(res, Err(ApiError::Conflict("user"))));

        child.kill().ok();
    }

    #[tokio::test]
    async fn confirm_password_success() {
        let (db, pw, _mailer, mut child) = setup(2727).await;

        let hashed_password = hash_password("password", &pw).await.unwrap();
        let user = users::ActiveModel {
            name: Set("Alice".into()),
            email: Set("alice@example.com".into()),
            password: Set(hashed_password),
            work_time: Set(25),
            break_time: Set(5),
            locale: Set("en".into()),
            ..Default::default()
        }
        .insert(&db)
        .await
        .unwrap();

        let secret = "secret";
        let jwt = create_jwt(user.id, secret).unwrap();

        confirm_password(&db, &pw, secret, &jwt, "password")
            .await
            .expect("password should be confirmed");

        child.kill().ok();
    }

    #[tokio::test]
    async fn confirm_password_invalid_password() {
        let (db, pw, _mailer, mut child) = setup(2828).await;

        let hashed_password = hash_password("password", &pw).await.unwrap();
        let user = users::ActiveModel {
            name: Set("Bob".into()),
            email: Set("bob@example.com".into()),
            password: Set(hashed_password),
            work_time: Set(25),
            break_time: Set(5),
            locale: Set("en".into()),
            ..Default::default()
        }
        .insert(&db)
        .await
        .unwrap();

        let secret = "secret";
        let jwt = create_jwt(user.id, secret).unwrap();

        let res = confirm_password(&db, &pw, secret, &jwt, "wrong").await;
        assert!(matches!(res, Err(ApiError::Unauthorized)));

        child.kill().ok();
    }

    #[tokio::test]
    async fn resend_verification_success() {
        let (db, pw, mailer, mut child) = setup(2929).await;

        let hashed_password = hash_password("password", &pw).await.unwrap();
        let user = users::ActiveModel {
            name: Set("Carol".into()),
            email: Set("carol@example.com".into()),
            password: Set(hashed_password),
            work_time: Set(25),
            break_time: Set(5),
            locale: Set("en".into()),
            ..Default::default()
        }
        .insert(&db)
        .await
        .unwrap();

        resend_verification(&db, &mailer, "carol@example.com")
            .await
            .expect("resend should succeed");

        let updated = users::Entity::find_by_id(user.id)
            .one(&db)
            .await
            .unwrap()
            .unwrap();
        assert!(updated.verification_token.is_some());

        child.kill().ok();
    }

    #[tokio::test]
    async fn resend_verification_already_verified() {
        let (db, pw, mailer, mut child) = setup(3030).await;

        let hashed_password = hash_password("password", &pw).await.unwrap();
        let _user = users::ActiveModel {
            name: Set("Dave".into()),
            email: Set("dave@example.com".into()),
            password: Set(hashed_password),
            email_verified_at: Set(Some(Utc::now())),
            work_time: Set(25),
            break_time: Set(5),
            locale: Set("en".into()),
            ..Default::default()
        }
        .insert(&db)
        .await
        .unwrap();

        let res = resend_verification(&db, &mailer, "dave@example.com").await;
        assert!(matches!(res, Err(ApiError::BadRequest(_))));

        child.kill().ok();
    }

    #[test]
    fn jwt_generate_and_verify() {
        let secret = "secret";
        let token = create_jwt(1, secret).unwrap();
        let claims = decode_jwt(token, secret).unwrap();
        assert!(verify_jwt(&claims).unwrap());
        assert_eq!(claims.sub, 1);
    }
}
