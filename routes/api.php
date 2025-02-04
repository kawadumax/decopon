<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TaskApiController;
use App\Http\Controllers\Api\LogApiController;
use App\Http\Controllers\Api\TimeEntryApiController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('tasks', TaskApiController::class, ['as' => 'api']);
    // updateCompleteへのルートを追加
    Route::put('tasks/{task}/complete', [TaskApiController::class, 'updateCompletion'])
        ->name('api.tasks.update.complete');

    // LogsのAPI
    Route::apiResource('logs', LogApiController::class, ['as' => 'api']);
    Route::get('logs/task/{taskId}', [LogApiController::class, 'getLogsTaskId'])->name('api.logs.task');

    //TimeEntryのAPI
    Route::apiResource('time-entries', TimeEntryApiController::class, ['as' => 'api']);
    Route::put('/time-entries/{id}', [TimeEntryApiController::class, 'update'])->name('api.time-entries-id.update');
});
