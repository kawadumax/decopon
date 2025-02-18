<?php

namespace App\Http\Controllers\Api;

use App\Events\TaskCompletedEvent;
use App\Http\Controllers\Api\ApiController;
use App\Models\Task;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class TaskApiController extends ApiController
{

  /**
   * get tasks
   */
  public function index(): JsonResponse
  {
    $tasks = Task::with('tags')->where('user_id', Auth::id())->get();
    return response()->json(['tasks' => $tasks], 200);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(Request $request): JsonResponse
  {
    $validated = $request->validate([
      'title' => 'required|string|max:255',
      'description' => 'nullable|string',
      'completed' => 'boolean',
      'parent_task_id' => [
        'nullable',
        'integer',
        Rule::exists('tasks', 'id')->whereNotNull('id'),
        function ($attribute, $value, $fail) {
          if (!Task::isValidParentTask($value, Auth::id())) {
            $fail('指定された親タスクが無効です。');
          }
        },
      ],
      'tags' => 'nullable|array',
    ]);

    $task = new Task($validated);
    $task->user_id = Auth::id();
    $task->save();


    // タグがリクエストに含まれている場合、関連付けを行う
    if (isset($validated['tags'])) {
      $task->tags()->attach($validated['tags']);
    }

    // タグを含めてタスクを取得
    $task = $task->load('tags');

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


  /**
   * Update the completion status of a task and its subtasks.
   */
  public function updateCompletion(Request $request, Task $task): JsonResponse
  {
    if ($task->user_id !== Auth::id()) {
      return response()->json([
        'success' => false,
        'message' => 'このタスクを更新する権限がありません。',
      ], 403);
    }

    $validated = $request->validate([
      'completed' => 'required|boolean',
    ]);

    $updatedTasks = $task->updateStatusRecursive($validated['completed']);

    if ($updatedTasks && !empty($updatedTasks) && $validated['completed']) {
      // 完了時、タスク完了イベントを発火する
      event(new TaskCompletedEvent($task));
    }

    return response()->json([
      'success' => true,
      'message' => 'タスクの完了状態が正常に更新されました。',
      'tasks' => $updatedTasks
    ], 200);
  }

  /**
   * get tasks by tag_id
   */
  public function getTasksByTagId($tagId): JsonResponse
  {
    // Validate the existence of the tag directly
    $tag = Tag::find($tagId);
    $tasks = $tag ? $tag->tasks()->with('tags')->get() : collect();
    return response()->json(
      [
        'success' => true,
        'message' => "タグに基づくタスクが正常に取得されました。",
        'tasks' => $tasks
      ],
      200
    );
  }
}
