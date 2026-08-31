<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json([
    'service' => 'smart-book-api',
    'status' => 'ok',
]))->name('api.health');
