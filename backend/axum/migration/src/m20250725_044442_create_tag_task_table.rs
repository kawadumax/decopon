use sea_orm_migration::{prelude::*, schema::*};

use crate::m20250725_022428_create_tasks_table::Tasks;
use crate::m20250725_030719_create_tags_table::Tags;
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(TagTask::Table)
                    .if_not_exists()
                    .col(pk_auto(TagTask::Id))
                    .col(integer(TagTask::TagId))
                    .col(integer(TagTask::TaskId))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_tag_task_tag_id")
                            .from(TagTask::Table, TagTask::TagId)
                            .to(Tags::Table, Tags::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_tag_task_task_id")
                            .from(TagTask::Table, TagTask::TaskId)
                            .to(Tasks::Table, Tasks::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(TagTask::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum TagTask {
    Table,
    Id,
    TagId,
    TaskId,
}
