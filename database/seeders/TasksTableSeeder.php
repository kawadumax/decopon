<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Task;

class TasksTableSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    Task::factory()->create([
      'title' => 'Task 1',
      'description' => 'Description for Task 1',
      'completed' => true,
      'user_id' => 1, // Replace with the actual user ID
    ]);
  }
}
