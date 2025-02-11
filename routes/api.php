<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TaskApiController;
use App\Http\Controllers\Api\LogApiController;
use App\Http\Controllers\Api\TimeEntryApiController;
use App\Http\Controllers\Api\TagApiController;

Route::middleware('auth:sanctum')->group(function () {
    //TasksのApi
    Route::get('tasks/tags/{tagId}', [TaskApiController::class, 'getTasksByTagId'])->name('api.tasks.tags.index');
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

    //TagsのApi
    Route::delete('tags/relation', [TagApiController::class, 'destroyRelation'])->name('api.tags.relation.destroy');
    Route::post('/tags/relation', [TagApiController::class, 'storeRelation'])->name('api.tags.relation.post');
    Route::apiResource('tags', TagApiController::class, ['as' => 'api']);
});
