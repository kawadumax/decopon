use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct UpdateProfileRequestDto {
    pub name: Option<String>,
    pub email: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct UpdatePasswordRequestDto {
    pub current_password: String,
    pub password: String,
}

#[derive(Serialize, Deserialize)]
pub struct DeleteProfileRequestDto {
    pub password: String,
}
