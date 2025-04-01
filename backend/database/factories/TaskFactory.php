<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Task;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Task>
 */
class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(2),
            'completed' => $this->faker->boolean(20),
            'user_id' => User::factory(),
            'parent_task_id' => null, // デフォルトでは親タスクなし
        ];
    }

    /**
     * メインタスクとして設定
     */
    public function main()
    {
        return $this->state(function (array $attributes) {
            return [
                'title' => 'メインタスク: ' . $this->faker->words(3, true),
            ];
        });
    }

    /**
     * サブタスクとして設定
     */
    public function subTask(Task $parentTask)
    {
        return $this->state(function (array $attributes) use ($parentTask) {
            return [
                'title' => 'サブタスク: ' . $this->faker->words(2, true),
                'parent_task_id' => $parentTask->id,
                'user_id' => $parentTask->user_id,
            ];
        });
    }

    /**
     * 完了済みタスクとして設定
     */
    public function completed()
    {
        return $this->state(function (array $attributes) {
            return [
                'completed' => true,
            ];
        });
    }
}
