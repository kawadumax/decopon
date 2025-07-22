use sea_orm::{EnumIter, Iterable};
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
                    .table(DecoponSessions::Table)
                    .if_not_exists()
                    .col(pk_auto(DecoponSessions::Id))
                    .col(enumeration(
                        DecoponSessions::Status,
                        Alias::new("status"),
                        SessionStatus::iter(),
                    ))
                    .col(timestamp(DecoponSessions::StartedAt).default(Expr::current_timestamp()))
                    .col(timestamp(DecoponSessions::EndedAt).null())
                    .col(timestamp(DecoponSessions::CreatedAt).default(Expr::current_timestamp()))
                    .col(timestamp(DecoponSessions::UpdatedAt).default(Expr::current_timestamp()))
                    .col(integer(DecoponSessions::UserId))
                    .foreign_key(
                        foreign_key::ForeignKey::create()
                            .name("fk_decopon_sessions_user_id")
                            .from(DecoponSessions::Table, DecoponSessions::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(DecoponSessions::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum DecoponSessions {
    Table,
    Id,
    UserId,
    Status,
    StartedAt,
    EndedAt,
    CreatedAt,
    UpdatedAt,
}

#[derive(Iden, EnumIter)]
pub enum SessionStatus {
    #[iden = "In_Progress"]
    InProgress,
    #[iden = "Completed"]
    Completed,
    #[iden = "Interrupted"]
    Interrupted,
    #[iden = "Abandoned"]
    Abandoned,
    #[iden = "Extended"]
    Extended,
}
