use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::services::users::{User, UserFull};

#[derive(Deserialize, Serialize)]
pub struct RegisterUserRequestDto {
    pub name: String,
    pub email: String,
    pub password: String,
    pub password_confirmation: String,
}

#[derive(Serialize)]
pub struct RegisterUserResponseDto {
    pub user: UserDto,
}

#[derive(Serialize)]
pub struct UserFullDto {
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
pub struct UserDto {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub work_time: i32,
    pub break_time: i32,
    pub locale: String,
}

impl From<User> for UserDto {
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

impl From<UserFull> for UserFullDto {
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

impl From<UserFull> for UserDto {
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
pub struct GetAuthUserResponseDto {
    pub user: UserDto,
}

#[derive(Deserialize, Serialize)]
pub struct LoginRequestDto {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct AuthResponseDto {
    pub token: String,
    pub user: UserDto,
}

#[derive(Deserialize, Serialize)]
pub struct ForgotPasswordRequestDto {
    pub email: String,
}

#[derive(Deserialize, Serialize)]
pub struct ResetPasswordRequestDto {
    pub token: String,
    pub email: String,
    pub password: String,
}
