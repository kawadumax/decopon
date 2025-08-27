use sea_orm_migration::{prelude::*, schema::*};

use crate::m20250725_030642_create_logs_table::Logs;
use crate::m20250725_030719_create_tags_table::Tags;
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(LogTag::Table)
                    .if_not_exists()
                    .col(pk_auto(LogTag::Id))
                    .col(integer(LogTag::LogId))
                    .col(integer(LogTag::TagId))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_log_tag_log_id")
                            .from(LogTag::Table, LogTag::LogId)
                            .to(Logs::Table, Logs::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_log_tag_tag_id")
                            .from(LogTag::Table, LogTag::TagId)
                            .to(Tags::Table, Tags::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(LogTag::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum LogTag {
    Table,
    Id,
    LogId,
    TagId,
}
