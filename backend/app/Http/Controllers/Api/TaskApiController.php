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
            $fail('The specified parent task is invalid.');
          }
        },
      ],
      'tags' => 'nullable|array',
      'tags.*' => 'integer|exists:tags,id', // タグIDのバリデーションを追加
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
    $statusCode = 201;
    return response()->json([
      'success' => true,
      'message' => 'Task created successfully.',
      'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
      'task' => $task
    ], $statusCode);
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Task $task): JsonResponse
  {
    if ($task->user_id !== Auth::id()) {
      $statusCode = 403;
      return response()->json([
        'success' => false,
        'message' => 'Permission denied: You cannot delete this task.',
        'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
      ], $statusCode);
    }

    if (!$task) {
      $statusCode = 404;
      return response()->json([
        'success' => false,
        'message' => 'Task not found.',
        'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
      ], $statusCode);
    }

    $task->delete();

    $statusCode = 200;
    return response()->json([
      'success' => true,
      'message' => 'Task deleted successfully.',
      'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
    ], $statusCode);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, Task $task): JsonResponse
  {
    if ($task->user_id !== Auth::id()) {
      $statusCode = 403;
      return response()->json([
        'success' => false,
        'message' => 'Permission denied: You cannot update this task.',
        'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
      ], $statusCode);
    }

    $validated = $request->validate([
      'title' => 'sometimes|required|string|max:255',
      'description' => 'nullable|string',
      'completed' => 'sometimes|boolean',
    ]);

    $task->update($validated);

    $statusCode = 200;
    return response()->json([
      'success' => true,
      'message' => 'Task updated successfully.',
      'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
      'task' => $task
    ], $statusCode);
  }

  /**
   * Update the completion status of a task and its subtasks.
   */
  public function updateCompletion(Request $request, Task $task): JsonResponse
  {
    if ($task->user_id !== Auth::id()) {
      $statusCode = 403;
      return response()->json([
        'success' => false,
        'message' => 'Permission denied: You cannot update this task.',
        'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
      ], $statusCode);
    }

    $validated = $request->validate([
      'completed' => 'required|boolean',
    ]);

    $updatedTasks = $task->updateStatusRecursive($validated['completed']);

    if ($updatedTasks && !empty($updatedTasks) && $validated['completed']) {
      // Fire task completion event when completed
      event(new TaskCompletedEvent($task));
    }

    $statusCode = 200;
    return response()->json([
      'success' => true,
      'message' => 'Task completion status updated successfully.',
      'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
      'tasks' => $updatedTasks
    ], $statusCode);
  }

  /**
   * get tasks by tag_id
   */
  public function getTasksByTagId($tagId): JsonResponse
  {
    // Validate the existence of the tag directly
    $tag = Tag::find($tagId);
    $tasks = $tag ? $tag->tasks()->with('tags')->get() : collect();

    $statusCode = 200;
    return response()->json([
      'success' => true,
      'message' => "Tasks retrieved successfully based on tag.",
      'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
      'tasks' => $tasks
    ], $statusCode);
  }
}
