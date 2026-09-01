<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Health endpoint
Route::get('/health', fn () => response()->json([
    'service' => 'smart-book-api',
    'status' => 'ok',
]))->name('api.health');

// Phase 1C.3 — Login / Logout / Current User
// Login is public (no auth middleware)
Route::post('/auth/login', [AuthController::class, 'login']);

// Logout and me require Sanctum authentication
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/auth/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
