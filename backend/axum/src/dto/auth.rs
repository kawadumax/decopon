use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::usecases::users::{User, UserFull};

#[derive(Debug, Deserialize, Serialize)]
pub struct RegisterUserRequest {
    pub name: String,
    pub email: String,
    pub password: String,
    pub password_confirmation: String,
}

#[derive(Serialize)]
pub struct RegisterUserResponse {
    pub user: UserResponse,
}

#[derive(Serialize)]
pub struct UserFullResponse {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub email_verified_at: Option<DateTime<Utc>>,
    pub verification_token: Option<String>,
    pub password: String,
    pub work_time: i32,
    pub break_time: i32,
    pub locale: String,
}

#[derive(Serialize, Deserialize)]
pub struct UserResponse {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub work_time: i32,
    pub break_time: i32,
    pub locale: String,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            name: user.name,
            email: user.email,
            work_time: user.work_time,
            break_time: user.break_time,
            locale: user.locale,
        }
    }
}

impl From<UserFull> for UserFullResponse {
    fn from(user: UserFull) -> Self {
        Self {
            id: user.id,
            name: user.name,
            email: user.email,
            email_verified_at: user.email_verified_at,
            verification_token: user.verification_token,
            password: user.password,
            work_time: user.work_time,
            break_time: user.break_time,
            locale: user.locale,
        }
    }
}

impl From<UserFull> for UserResponse {
    fn from(user: UserFull) -> Self {
        Self {
            id: user.id,
            name: user.name,
            email: user.email,
            work_time: user.work_time,
            break_time: user.break_time,
            locale: user.locale,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct GetAuthUserResponse {
    pub user: UserResponse,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ForgotPasswordRequest {
    pub email: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ResetPasswordRequest {
    pub token: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct ConfirmPasswordRequest {
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct ResendVerificationRequest {
    pub email: String,
}

#[derive(Debug, Serialize)]
pub struct StatusResponse {
    pub status: String,
}
