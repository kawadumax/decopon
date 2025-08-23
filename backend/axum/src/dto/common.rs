use serde::Deserialize;

#[derive(Deserialize)]
pub struct UserQueryDto {
    pub user_id: i32,
}
