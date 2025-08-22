use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct UpdateProfileRequestDto {
    pub id: i32,
    pub name: Option<String>,
    pub email: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct UpdatePasswordRequestDto {
    pub id: i32,
    pub current_password: String,
    pub password: String,
}

#[derive(Serialize, Deserialize)]
pub struct DeleteProfileRequestDto {
    pub id: i32,
    pub password: String,
}
