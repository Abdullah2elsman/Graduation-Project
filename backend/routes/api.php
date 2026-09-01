<?php

use App\Http\Controllers\Admin\InstructorInvitationController as AdminInstructorInvitationController;
use App\Http\Controllers\Admin\StudentLifecycleController;
use App\Http\Controllers\Auth\InstructorInvitationController as AuthInstructorInvitationController;
use App\Http\Controllers\Auth\PasswordRecoveryController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

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

// Phase 1C.9 — Forgot / Reset Password (public)
Route::post('/auth/forgot-password', [PasswordRecoveryController::class, 'forgot'])
    ->middleware('throttle:forgot-password');
Route::post('/auth/reset-password', [PasswordRecoveryController::class, 'reset'])
    ->middleware('throttle:reset-password');

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

// Phase 1C.8 — Public Instructor invitation validation and acceptance
Route::get('/auth/instructor-invitations/{token}', [AuthInstructorInvitationController::class, 'show'])
    ->middleware('throttle:10,1');
Route::post('/auth/instructor-invitations/{token}/accept', [AuthInstructorInvitationController::class, 'accept'])
    ->middleware('throttle:5,1');

// Phase 1C.8 — Admin Instructor creation and invitation reissue
Route::prefix('/admin')
    ->middleware(['auth:sanctum', 'application.access', 'admin'])
    ->group(function (): void {
        Route::post('/instructors', [AdminInstructorInvitationController::class, 'store']);
        Route::post('/instructors/{instructor}/invitation', [AdminInstructorInvitationController::class, 'reissue'])
            ->middleware('throttle:3,1');
    });

// Phase 1C.7 — Admin Student lifecycle
Route::prefix('/admin/students/{student}')
    ->middleware(['auth:sanctum', 'application.access', 'admin'])
    ->group(function (): void {
        Route::post('/approve', [StudentLifecycleController::class, 'approve']);
        Route::post('/reject', [StudentLifecycleController::class, 'reject']);
        Route::post('/restore-to-pending', [StudentLifecycleController::class, 'restoreToPending']);
    });
