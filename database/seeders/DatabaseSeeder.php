<?php

namespace Database\Seeders;

class DatabaseSeeder extends BaseSeeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $environment = app()->environment();

        $this->call(MasterSeeder::class);

        if ($environment == 'local') {
            $this->call(UsersTableSeeder::class);
            $this->call(TasksTableSeeder::class);
            $this->call(TimeEntriesTableSeeder::class);
            $this->call(LogsTableSeeder::class);
            $this->call(TagsTableSeeder::class);
        }
    }
}
