<?php

use Illuminate\Support\Facades\Route;

Route::get('/resources/js/Workers/{any}', function ($any) {
    $url = "http://localhost:5173/resources/js/Workers/{$any}";
    return response()->stream(function () use ($url) {
        // Directly stream the remote content without loading it fully into memory
        readfile($url);
    }, 200, ['Content-Type' => 'text/javascript']);
})->where('any', '(.*)');
