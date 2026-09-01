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

// Phase 1C.4 — Student Registration (public)
Route::post('/auth/register', [AuthController::class, 'register']);

// Phase 1C.5 — Email Verification
// The canonical name `verification.verify` is required by Laravel's stock
// VerifyEmail notification, which builds its signed URL from this route.
Route::get('/auth/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->name('verification.verify')
    ->middleware(['auth:sanctum', 'signed', 'throttle:6,1']);

// Resend the verification notification (authenticated PENDING + unverified only)
Route::post('/auth/email/verification-notification', [AuthController::class, 'resendVerificationNotification'])
    ->middleware('auth:sanctum');

// Logout and me require Sanctum authentication
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/auth/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
