<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\ApiController;
use App\Models\Tag;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TagApiController extends ApiController
{
    /**
     * ログイン中ユーザの持つタグ全てを取得する
     */
    public function index(): JsonResponse
    {
        $tags = Tag::where('user_id', Auth::id())->get();
        return response()->json(['tags' => $tags]);
    }

    /**
     * 新しいタグをストレージに保存する
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $tag = new Tag($validated);
        $tag->user_id = Auth::id();
        $tag->save();

        return response()->json([
            'success' => true,
            'message' => 'タグが正常に作成されました。',
            'tag' => $tag
        ], 201);
    }

    /**
     * 複数のタグを処理し、指定されたタスクに関連付ける
     */
    public function storeSingular(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'name' => 'required|string|max:255',
        ]);

        $task = Task::findOrFail($validated['task_id']);

        // ユーザーがこのタスクを編集する権限があるか確認
        if ($task->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'このタスクにタグを追加する権限がありません。',
            ], 403);
        }

        $user_id = Auth::id();

        $tag = Tag::firstOrCreate(
            ['name' => $validated["name"], 'user_id' => $user_id],
        );

        // タスクとタグを関連付ける（重複を避けるため）
        $task->tags()->syncWithoutDetaching([$tag->id]);

        $createdTags[] = $tag;

        return response()->json([
            'success' => true,
            'message' => 'タグが正常に作成され、タスクに関連付けられました。',
            'tag' => $tag
        ], 201);
    }

    /**
     * 複数のタグを処理し、指定されたタスクに関連付ける
     */
    public function storeMultiple(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'tags' => 'required|array',
            'tags.*.name' => 'required|string|max:255',
        ]);

        $task = Task::findOrFail($validated['task_id']);

        // ユーザーがこのタスクを編集する権限があるか確認
        if ($task->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'このタスクにタグを追加する権限がありません。',
            ], 403);
        }

        $createdTags = [];
        $user_id = Auth::id();

        DB::transaction(function () use ($validated, $task, &$createdTags, $user_id) {
            foreach ($validated['tags'] as $tagData) {
                $tag = Tag::firstOrCreate(
                    ['name' => $tagData['name'], 'user_id' => $user_id],
                );

                // タスクとタグを関連付ける（重複を避けるため）
                $task->tags()->syncWithoutDetaching([$tag->id]);

                $createdTags[] = $tag;
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'タグが正常に作成され、タスクに関連付けられました。',
            'tags' => $createdTags
        ], 201);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Tag $tag): JsonResponse
    {
        if ($tag->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'このタグを削除する権限がありません。',
            ], 403);
        }

        if (!$tag) {
            return response()->json([
                'success' => false,
                'message' => 'タグが見つかりません。',
            ], 404);
        }

        $tag->delete();

        return response()->json([
            'success' => true,
            'message' => 'タグが正常に削除されました。',
        ], 200);
    }
}
