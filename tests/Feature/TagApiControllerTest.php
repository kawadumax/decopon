<?php

use App\Models\User;
use App\Models\Task;
use App\Models\Tag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use function Pest\Laravel\postJson;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\assertDatabaseHas;

uses(RefreshDatabase::class);

it('allows a user to store multiple tags for a task', function () {
    // ユーザーを作成
    $user = User::factory()->create();

    // ユーザーのタスクを作成
    $task = Task::factory()->create(['user_id' => $user->id]);
    // タグのデータを準備
    $tags = [
        ['name' => 'タグ1'],
        ['name' => 'タグ2'],
        ['name' => 'タグ3'],
    ];

    // APIリクエストを送信
    $response = $this->actingAs($user)->postJson(route('api.tags.multiple'), [
        'task_id' => $task->id,
        'tags' => $tags,
    ]);

    // レスポンスを検証
    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'タグが正常に作成され、タスクに関連付けられました。',
        ]);

    // データベースにタグが保存されているか確認
    assertDatabaseCount('tags', 3);

    // タスクとタグの関連付けが正しく行われているか確認
    foreach ($tags as $tag) {
        assertDatabaseHas('tags', [
            'name' => $tag['name'],
            'user_id' => $user->id,
        ]);

        $tagModel = Tag::where('name', $tag['name'])->where('user_id', $user->id)->first();

        expect($tagModel)->not->toBeNull();
        // コレクションの中に、$tagModel と同じ id を持つタグが存在するかを検証する
        expect($task->tags->pluck('id')->toArray())->toContain($tagModel->id);
    }
});
