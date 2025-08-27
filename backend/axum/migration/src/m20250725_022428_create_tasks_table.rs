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
                    .table(Tasks::Table)
                    .if_not_exists()
                    .col(pk_auto(Tasks::Id))
                    .col(string(Tasks::Title).not_null().default(Expr::value("")))
                    .col(string(Tasks::Description).default(Expr::value("")))
                    .col(boolean(Tasks::Completed).default(false))
                    .col(timestamp(Tasks::CreatedAt).default(Expr::current_timestamp()))
                    .col(timestamp(Tasks::UpdatedAt).default(Expr::current_timestamp()))
                    .col(integer(Tasks::UserId))
                    .col(integer_null(Tasks::ParentTaskId))
                    .foreign_key(
                        foreign_key::ForeignKey::create()
                            .name("fk_tasks_user_id")
                            .from(Tasks::Table, Tasks::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        foreign_key::ForeignKey::create()
                            .name("fk_tasks_parent_task_id")
                            .from(Tasks::Table, Tasks::ParentTaskId)
                            .to(Tasks::Table, Tasks::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Tasks::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Tasks {
    Table,
    Id,
    Title,
    Description,
    Completed,
    UserId,
    ParentTaskId,
    CreatedAt,
    UpdatedAt,
}
