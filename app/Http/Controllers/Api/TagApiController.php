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
        $tags = Tag::with('tasks')->where('user_id', Auth::id())->get();
        debug_log("tags", $tags);
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
     * タグを処理し、指定されたタスクに関連付ける
     */
    public function storeRelation(Request $request): JsonResponse
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

        $tag = Tag::firstOrCreate(
            ['name' => $validated["name"], 'user_id' => Auth::id()],
        );

        // タスクとタグを関連付ける（重複を避けるため）
        $task->tags()->syncWithoutDetaching([$tag->id]);

        return response()->json([
            'success' => true,
            'message' => 'タグが正常に作成され、タスクに関連付けられました。',
            'tag' => $tag
        ], 201);
    }

    /**
     * Remove the association from storage.
     */
    public function destroyRelation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'name' => 'required|string|max:255',
        ]);

        $task = Task::with("tags")->findOrFail($validated['task_id']);

        if ($task->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'このタスクのタグを削除する権限がありません。',
            ], 403);
        }

        $tag = $task->tags->where(
            'name',
            $validated["name"]
        )->first();

        if ($tag) {
            $task->tags()->detach([$tag->id]);
        }

        return response()->json([
            'success' => true,
            'message' => '正常にタスクからタグの関連付けが削除されました。',
            'tag' => 12
        ], 201);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroyMultiple(Request $request): JsonResponse
    {
        debug_log("destroyMultiple called");
        $validated = $request->validate([
            'tag_ids' => 'required|array',
            'tag_ids.*' => 'exists:tags,id,user_id,' . Auth::id(), // 各タグのIDが存在し、ユーザーが所有していることを確認
        ]);

        Tag::where('user_id', Auth::id())->whereIn('id', $validated['tag_ids'])->delete();

        return response()->json([
            'success' => true,
            'message' => 'タグが正常に削除されました。',
        ], 200);
    }
}
