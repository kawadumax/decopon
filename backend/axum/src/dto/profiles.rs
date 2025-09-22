use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProfileRequestDto {
    pub name: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePasswordRequestDto {
    pub current_password: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteProfileRequestDto {
    pub password: String,
}
