<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Task;
use App\Models\Log;

class LogsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Adminユーザーを取得
        $adminUser = User::where('email', '***REMOVED***')->first();

        // Adminユーザーが存在する場合のみログを作成
        if ($adminUser) {
            $this->createLogsForAdminTasks($adminUser);
        }
    }

    private function createLogsForAdminTasks(User $adminUser): void
    {
        // Adminユーザーのタスクを取得
        $adminTasks = Task::where('user_id', $adminUser->id)->get();

        foreach ($adminTasks as $task) {
            // 各タスクに対して1〜3個のログを作成
            $logCount = rand(1, 3);
            for ($i = 0; $i < $logCount; $i++) {
                Log::factory()->create([
                    'task_id' => $task->id,
                    'user_id' => $adminUser->id,
                    'content' => "Adminユーザーによるログ エントリー " . ($i + 1),
                ]);
            }
        }
    }
}
