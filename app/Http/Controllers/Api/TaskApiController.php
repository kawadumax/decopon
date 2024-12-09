<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\ApiController;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class TaskApiController extends ApiController
{

  /**
   * Store a newly created resource in storage.
   */
  public function store(Request $request): JsonResponse
  {
    $validated = $request->validate([
      'title' => 'required|string|max:255',
      'description' => 'nullable|string',
      'completed' => 'boolean',
    ]);

    $task = new Task($validated);
    $task->user_id = Auth::id();
    $task->save();

    return response()->json([
      'success' => true,
      'message' => 'タスクが正常に作成されました。',
      'task' => $task
    ], 201);
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Task $task): JsonResponse
  {
    if ($task->user_id !== Auth::id()) {
      return response()->json([
        'success' => false,
        'message' => 'このタスクを削除する権限がありません。',
      ], 403);
    }

    if (!$task) {
      return response()->json([
        'success' => false,
        'message' => 'タスクが見つかりません。',
      ], 404);
    }

    $task->delete();

    return response()->json([
      'success' => true,
      'message' => 'タスクが正常に削除されました。',
    ], 200);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, Task $task): JsonResponse
  {
    if ($task->user_id !== Auth::id()) {
      return response()->json([
        'success' => false,
        'message' => 'このタスクを更新する権限がありません。',
      ], 403);
    }

    $validated = $request->validate([
      'title' => 'sometimes|required|string|max:255',
      'description' => 'nullable|string',
      'completed' => 'sometimes|boolean',
    ]);

    $task->update($validated);

    return response()->json([
      'success' => true,
      'message' => 'タスクが正常に更新されました。',
      'task' => $task
    ], 200);
  }
}
