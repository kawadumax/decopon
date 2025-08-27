use sea_orm::{EnumIter, Iterable};
use sea_orm_migration::{prelude::*, schema::*};

use crate::m20250725_022035_create_users_table::Users;
use crate::m20250725_022428_create_tasks_table::Tasks;
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Logs::Table)
                    .if_not_exists()
                    .col(pk_auto(Logs::Id))
                    .col(string(Logs::Content))
                    .col(enumeration(
                        Logs::Source,
                        Alias::new("source"),
                        LogSource::iter(),
                    ))
                    .col(timestamp(Logs::CreatedAt).default(Expr::current_timestamp()))
                    .col(timestamp(Logs::UpdatedAt).default(Expr::current_timestamp()))
                    .col(integer(Logs::UserId))
                    .col(integer_null(Logs::TaskId))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_logs_user_id")
                            .from(Logs::Table, Logs::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_logs_task_id")
                            .from(Logs::Table, Logs::TaskId)
                            .to(Tasks::Table, Tasks::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Logs::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Logs {
    Table,
    Id,
    Content,
    UserId,
    TaskId,
    Source,
    CreatedAt,
    UpdatedAt,
}

#[derive(Iden, EnumIter)]
pub enum LogSource {
    #[iden = "User"]
    User,
    #[iden = "System"]
    System,
}
