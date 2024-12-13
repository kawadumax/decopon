<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TaskApiController;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('tasks', TaskApiController::class, ['as' => 'api']);
    // updateCompleteへのルートを追加
    Route::put('tasks/{task}/complete', [TaskApiController::class, 'updateCompletion'])
        ->name('api.tasks.update.complete');
});
