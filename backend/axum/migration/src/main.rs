use sea_orm_migration::cli;

#[async_std::main]
async fn main() {
    cli::run_cli(migration::Migrator).await;
}
