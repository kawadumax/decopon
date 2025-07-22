use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Users::Table)
                    .if_not_exists()
                    .col(pk_auto(Users::Id))
                    .col(string(Users::Name).not_null())
                    .col(string(Users::Email).unique_key().not_null())
                    .col(timestamp(Users::EmailVerifiedAt).null())
                    .col(string(Users::Password).not_null())
                    .col(integer(Users::WorkTime).default(25))
                    .col(integer(Users::BreakTime).default(5))
                    .col(string(Users::Locale).char_len(2).default("en"))
                    .col(timestamp(Users::CreatedAt).default(Expr::current_timestamp()))
                    .col(timestamp(Users::UpdatedAt).default(Expr::current_timestamp()))
                    .to_owned(),
            )
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Users::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Users {
    Table,
    Id,
    Name,
    Email,
    EmailVerifiedAt,
    Password,
    WorkTime,
    BreakTime,
    Locale,
    CreatedAt,
    UpdatedAt,
}
