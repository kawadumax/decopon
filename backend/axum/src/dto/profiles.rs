use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProfileRequest {
    pub name: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePasswordRequest {
    pub current_password: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteProfileRequest {
    pub password: String,
}
