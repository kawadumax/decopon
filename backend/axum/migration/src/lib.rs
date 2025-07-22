pub use sea_orm_migration::prelude::*;
mod m20250725_022035_create_users_table;
mod m20250725_022428_create_tasks_table;
mod m20250725_030614_create_decopon_sessions_table;
mod m20250725_030642_create_logs_table;
mod m20250725_030719_create_tags_table;
mod m20250725_044431_create_log_tag_table;
mod m20250725_044442_create_tag_task_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20250725_022035_create_users_table::Migration),
            Box::new(m20250725_022428_create_tasks_table::Migration),
            Box::new(m20250725_030614_create_decopon_sessions_table::Migration),
            Box::new(m20250725_030642_create_logs_table::Migration),
            Box::new(m20250725_030719_create_tags_table::Migration),
            Box::new(m20250725_044431_create_log_tag_table::Migration),
            Box::new(m20250725_044442_create_tag_task_table::Migration),
        ]
    }
}
