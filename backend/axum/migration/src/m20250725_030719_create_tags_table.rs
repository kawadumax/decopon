use sea_orm_migration::{prelude::*, schema::*};

use crate::m20250725_022035_create_users_table::Users;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Tags::Table)
                    .if_not_exists()
                    .col(pk_auto(Tags::Id))
                    .col(string(Tags::Name))
                    .col(timestamp(Tags::CreatedAt).default(Expr::current_timestamp()))
                    .col(timestamp(Tags::UpdatedAt).default(Expr::current_timestamp()))
                    .col(integer(Tags::UserId))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_tags_user_id")
                            .from(Tags::Table, Tags::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Tags::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Tags {
    Table,
    Id,
    Name,
    UserId,
    UpdatedAt,
    CreatedAt,
}
