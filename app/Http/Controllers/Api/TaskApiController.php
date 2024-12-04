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
}
