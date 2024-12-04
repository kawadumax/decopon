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
