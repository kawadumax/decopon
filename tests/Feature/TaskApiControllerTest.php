<?php

use App\Models\User;
use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('can create task', function () {
    $taskData = [
        'title' => 'New Task',
        'description' => 'This is a new task',
        'completed' => false,
    ];

    $response = $this->actingAs($this->user)
        ->postJson('/api/tasks', $taskData);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'タスクが正常に作成されました。',
        ]);

    $this->assertDatabaseHas('tasks', $taskData);
});

test('can destroy task', function () {
    $taskData = [
        'title' => 'New Task',
        'description' => 'This is a new task',
        'completed' => false,
    ];

    // タスクを作成
    $response = $this->actingAs($this->user)
        ->postJson('/api/tasks', $taskData);

    // 作成されたタスクのIDを取得
    $taskId = $response->json("task.id");

    // タスクを削除
    $deleteResponse = $this->actingAs($this->user)
        ->deleteJson("/api/tasks/{$taskId}");

    $deleteResponse->assertStatus(204);

    // データベースからタスクが削除されたことを確認
    $this->assertDatabaseMissing('tasks', $taskData);
});

test('can update task', function () {
    $taskData = [
        'title' => 'New Task',
        'description' => 'This is a new task',
        'completed' => false,
    ];

    // タスクを作成
    $response = $this->actingAs($this->user)
        ->postJson('/api/tasks', $taskData);

    // 作成されたタスクのIDを取得
    $taskId = $response->json("task.id");

    // タスクを更新
    $updateResponse = $this->actingAs($this->user)
        ->putJson("/api/tasks/{$taskId}", [
            'title' => 'Updated Task',
            'description' => 'This is an updated task',
            'completed' => true,
        ]);

    $updateResponse->assertStatus(200)->assertJson([
        'success' => true,
        'message' => 'タスクが正常に更新されました。',
    ]);
});
