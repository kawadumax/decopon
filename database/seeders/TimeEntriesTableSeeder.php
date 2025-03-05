<?php

namespace Database\Seeders;

use App\Models\TimeEntry;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;

class TimeEntriesTableSeeder extends BaseSeeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        $adminEmail = $this->getAdminEmail();
        //Adminユーザを取得
        $adminUser = User::where('email', $adminEmail)->first();
        //Adminユーザが存在する場合のみタスクを作成
        if ($adminUser) {
            $this->createTimeEntryForUser($adminUser);
        }
    }

    private function createTimeEntryForUser(User $user): void
    {

        $entry = TimeEntry::factory()->entry_30_minutes()->for($user)->create();
    }
}
