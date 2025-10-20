## ビルドターゲット

このバックエンドは用途ごとにバイナリを分離しています。

- アプリ向けシングルユーザーモード: `cargo run --bin app`（または `cargo run --bin app --release`）
- Web 向けマルチユーザーモード: `cargo run --no-default-features --features web --bin web`

それぞれ必要な Cargo feature（SQLite / PostgreSQL）を有効化してビルドされます。

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