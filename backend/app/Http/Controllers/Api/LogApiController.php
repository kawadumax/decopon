<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\ApiController;
use App\Models\Log;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class LogApiController extends ApiController
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // ログ一覧を取得
        // ログイン中のユーザの内容のみ見れる。
        $userId = Auth::id();
        $logs = Log::where('user_id', $userId)->get();
        return response()->json($logs);
    }

    /**
     * ユーザーIDとタスクIDに基づいてログ一覧を取得
     */
    public function getLogsTaskId($taskId)
    {
        $userId = Auth::id();
        logger("userId", [$userId]);
        $logs = Log::where('user_id', $userId)
            ->where('task_id', $taskId)
            ->get();
        logger("logs", [$logs]);
        return response()->json($logs);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:255',
            'task_id' => [
                'nullable',
                'integer',
                Rule::exists('tasks', 'id')->whereNotNull('id'),
            ],
        ]);

        $log = new Log($validated);
        $log->user_id = \Auth::id();
        $log->save();

        return response()->json([
            'success' => true,
            'log' => $log
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Log $log)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Log $log)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Log $log)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Log $log)
    {
        //
    }
}
