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

        $statusCode = 201;
        return response()->json([
            'success' => true,
            'message' => 'Tag created successfully.',
            'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
            'tag' => $tag
        ], $statusCode);
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
            $statusCode = 403;
            return response()->json([
                'success' => false,
                'message' => 'Permission denied: You cannot add tags to this task.',
                'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
            ], $statusCode);
        }

        $tag = Tag::firstOrCreate(
            ['name' => $validated["name"], 'user_id' => Auth::id()],
        );

        // タスクとタグを関連付ける（重複を避けるため）
        $task->tags()->syncWithoutDetaching([$tag->id]);

        $statusCode = 201;
        return response()->json([
            'success' => true,
            'message' => 'Successfully created tag and associated it with the task.',
            'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
            'tag' => $tag
        ], $statusCode);
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
            $statusCode = 403;
            return response()->json([
                'success' => false,
                'message' => 'Permission denied: You cannot remove tags from this task.',
                'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
            ], $statusCode);
        }

        $tag = $task->tags->where(
            'name',
            $validated["name"]
        )->first();

        if ($tag) {
            $task->tags()->detach([$tag->id]);
        }

        $statusCode = 201;
        return response()->json([
            'success' => true,
            'message' => 'Successfully removed tag from the task.',
            'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
            'tag' => $tag
        ], $statusCode);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroyMultiple(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tag_ids' => 'required|array',
            'tag_ids.*' => 'exists:tags,id,user_id,' . Auth::id(), // 各タグのIDが存在し、ユーザーが所有していることを確認
        ]);

        Tag::where('user_id', Auth::id())->whereIn('id', $validated['tag_ids'])->delete();

        $statusCode = 200;
        return response()->json([
            'success' => true,
            'message' => 'Successfully removed tags.',
            'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
        ], $statusCode);
    }
}
