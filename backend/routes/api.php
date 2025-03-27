<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TaskApiController;
use App\Http\Controllers\Api\LogApiController;
use App\Http\Controllers\Api\TimeEntryApiController;
use App\Http\Controllers\Api\TagApiController;
use App\Http\Controllers\Api\ProfileApiController;
use App\Http\Controllers\Api\PreferenceApiController;

Route::middleware('auth:sanctum')->group(function () {
    //TasksのApi
    Route::get('/tasks/tags/{tagId}', [TaskApiController::class, 'getTasksByTagId'])->name('api.tasks.tags.index');
    Route::apiResource('tasks', TaskApiController::class, ['as' => 'api']);

    // updateCompleteへのルートを追加
    Route::put('/tasks/{task}/complete', [TaskApiController::class, 'updateCompletion'])
        ->name('api.tasks.update.complete');

    // LogsのAPI
    Route::get('/logs/task/{taskId}', [LogApiController::class, 'getLogsTaskId'])->name('api.logs.task');
    Route::apiResource('logs', LogApiController::class, ['as' => 'api']);

    //TimeEntryのAPI
    Route::get('/time-entries/cycles', [TimeEntryApiController::class, 'getCycles'])->name('api.time-entries.cycles');
    Route::put('/time-entries/{id}', [TimeEntryApiController::class, 'update'])->name('api.time-entries-id.update');
    Route::apiResource('time-entries', TimeEntryApiController::class, ['as' => 'api']);

    //TagsのApi
    Route::delete('/tags/relation', [TagApiController::class, 'destroyRelation'])->name('api.tags.relation.destroy');
    Route::post('/tags/relation', [TagApiController::class, 'storeRelation'])->name('api.tags.relation.post');
    Route::delete('/tags/multiple', [TagApiController::class, 'destroyMultiple'])->name('api.tags.destroy');
    Route::apiResource('tags', TagApiController::class, ['as' => 'api'])->only(["index", "store"]);

    // Profile
    Route::get('/profile', [ProfileApiController::class, 'edit'])->name('api.profile.edit');
    Route::patch('/profile', [ProfileApiController::class, 'update'])->name('api.profile.update');
    Route::delete('/profile', [ProfileApiController::class, 'destroy'])->name('api.profile.destroy');
    Route::put('/profile/password', [ProfileApiController::class, 'updatePassword'])->name('api.profile.password.update');


    // Preference
    Route::put('/preference', [PreferenceApiController::class, 'update'])->name('api.preference.update');
});
