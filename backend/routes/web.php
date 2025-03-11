<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\PreferenceController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\TagController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 開発環境においてはプロキシを用意し、vite serverを一部統合する
if (!app()->isProduction()) {
    require __DIR__ . '/proxy.dev.php';
}

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Preference
    Route::patch('/preference', [PreferenceController::class, 'update'])->name('preference.update');

    // Log
    Route::get("/logs", [LogController::class, "index"])->name('logs.index');

    // Tag
    Route::get("/tags", [TagController::class, "index"])->name('tags.index');
});

require __DIR__ . '/auth.php';
