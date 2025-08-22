use serde::{Deserialize, Serialize};

use crate::services::users::User;

#[derive(Serialize)]
pub struct PreferenceResponseDto {
    pub work_time: i32,
    pub break_time: i32,
    pub locale: String,
}

impl From<User> for PreferenceResponseDto {
    fn from(user: User) -> Self {
        Self {
            work_time: user.work_time,
            break_time: user.break_time,
            locale: user.locale,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct UpdatePreferenceRequestDto {
    pub id: i32,
    pub work_time: i32,
    pub break_time: i32,
    pub locale: String,
}
