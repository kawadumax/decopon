## Commands for migration

```sh
cargo run -p migration -- generate MIGRATION_NAME # generate migration file
cargo run -p migration -- fresh -u "sqlite://../database/db.sqlite?mode=rwc" # apply migration
# see migration/README.md for more commands
```

## Commands for entity

```sh
sea-orm-cli generate entity -u "sqlite://../database/db.sqlite?mode=rwc" -o src/entities # generate entity
```