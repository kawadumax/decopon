<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Task;
use App\Models\User;

class TasksTableSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    //Adminユーザを取得
    $adminUser = User::where('email', '***REMOVED***')->first();
    //Adminユーザが存在する場合のみタスクを作成
    if ($adminUser) {
      $this->createTasksForUser($adminUser);
    }

    // ユーザーを作成
    $user = User::factory()->create();

    // ユーザーにタスクを作成
    $this->createTasksForUser($user);
  }

  private function createTasksForUser(User $user): void
  {
    // メインタスク（親タスク）を作成
    $mainTasks = Task::factory()
      ->count(5)
      ->for($user)
      ->create();

    // 各メインタスクに対してサブタスクを作成
    foreach ($mainTasks as $mainTask) {
      Task::factory()
        ->count(3)
        ->subTask($mainTask)
        ->create();
    }

    // 完了済みタスクを作成（メインタスクとサブタスク両方）
    $completedMainTask = Task::factory()->completed()->for($user)->create();
    Task::factory()
      ->count(2)
      ->subTask($completedMainTask)
      ->completed()
      ->create();

    // 通常のタスクを追加（親タスクなし）
    Task::factory()
      ->count(10)
      ->for($user)
      ->create();
  }
}
