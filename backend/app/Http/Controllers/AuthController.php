<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\EmailNormalizer;
use App\Support\PasswordRules;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    /**
     * Login.
     *
     * POST /api/auth/login
     *
     * Email is normalized (trimmed and lowercased) before lookup and validation.
     * Correct credentials allow PENDING / ACTIVE / SUSPENDED / REJECTED accounts.
     * Generic 401 on invalid credentials. No remember-me behavior.
     */
    public function login(Request $request)
    {
        $request->merge([
            'email' => EmailNormalizer::normalize($request->input('email')),
        ]);

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $credentials = [
            'email' => $validated['email'],
            'password' => $validated['password'],
        ];

        $throttleKey = 'auth:login:'.hash(
            'sha256',
            $validated['email'].'|'.$request->ip(),
        );

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            return response()->json([
                'message' => 'Too many login attempts. Please try again later.',
            ], 429)->header(
                'Retry-After',
                (string) RateLimiter::availableIn($throttleKey),
            );
        }

        if (! Auth::attempt($credentials)) {
            RateLimiter::hit($throttleKey, 60);

            return response()->json([
                'message' => __('auth.failed'),
            ], 401);
        }

        RateLimiter::clear($throttleKey);

        $request->session()->regenerate();

        $user = Auth::user();
        $user->last_login_at = now();
        $user->save();

        return response()->json([
            'data' => [
                'user' => $this->userRepresentation($user),
            ],
        ], 200);
    }

    /**
     * Register.
     *
     * POST /api/auth/register
     *
     * Public Student-only registration. Email is normalized (trimmed and
     * lowercased) before validation, uniqueness, and persistence. The server
     * owns role (STUDENT), status (PENDING), and email_verified_at (null);
     * the client cannot override them. Password follows the frozen policy
     * (>= 8 chars, at least one letter, at least one number, confirmed) and
     * is hashed through Laravel's configured hashing service. An authenticated
     * restricted session is established immediately and the identifier is
     * regenerated. Returns 201 with the safe user representation. The email
     * verification notification is dispatched after the restricted session is
     * established.
     */
    public function register(Request $request)
    {
        $request->merge([
            'email' => EmailNormalizer::normalize($request->input('email')),
        ]);

        $normalizedEmail = $request->input('email');

        $throttleKey = 'auth:register:'.hash(
            'sha256',
            $normalizedEmail.'|'.$request->ip(),
        );

        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            return response()->json([
                'message' => 'Too many registration attempts. Please try again later.',
            ], 429)->header(
                'Retry-After',
                (string) RateLimiter::availableIn($throttleKey),
            );
        }

        RateLimiter::hit($throttleKey, 60);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => PasswordRules::confirmed(),
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        // Reload the server-owned lifecycle defaults (role=STUDENT,
        // status=PENDING, email_verified_at=null) so the response reflects
        // exactly what was persisted.
        $user->refresh();

        Auth::guard('web')->login($user);

        $request->session()->regenerate();

        RateLimiter::clear($throttleKey);

        $user->sendEmailVerificationNotification();

        return response()->json([
            'data' => [
                'user' => $this->userRepresentation($user),
            ],
        ], 201);
    }

    /**
     * Verify email.
     *
     * GET /api/auth/email/verify/{id}/{hash}
     *
     * Requires an authenticated Sanctum session (auth:sanctum) and a valid,
     * non-expired temporary signed URL (signed middleware). The
     * EmailVerificationRequest guarantees the authenticated user id matches
     * {id} and that {hash} matches sha1 of the authenticated user's email.
     * Successful verification only sets email_verified_at; status stays
     * PENDING and no approval/enrollment metadata is touched. Already-verified
     * accounts are handled idempotently. The route name `verification.verify`
     * is required by Laravel's stock VerifyEmail notification.
     *
     * On success the callback redirects to the configured Angular
     * verification-success page (FRONTEND_URL + /auth/verify-email/success).
     */
    public function verifyEmail(EmailVerificationRequest $request)
    {
        $request->fulfill();

        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');

        return redirect($frontendUrl.'/auth/verify-email/success');
    }

    /**
     * Resend verification notification.
     *
     * POST /api/auth/email/verification-notification
     *
     * Authenticated (auth:sanctum). Only a STUDENT/PENDING + unverified account
     * may resend. Verified accounts return 409; other ineligible states return
     * 403. A successful dispatch returns a generic 202 acknowledgement without
     * exposing unnecessary account state. Throttled per user.
     */
    public function resendVerificationNotification(Request $request)
    {
        $user = $request->user();

        $throttleKey = 'auth:resend:verify:'.$user->getKey();

        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            return response()->json([
                'message' => 'Too many verification notification attempts. Please try again later.',
            ], 429)->header(
                'Retry-After',
                (string) RateLimiter::availableIn($throttleKey),
            );
        }

        RateLimiter::hit($throttleKey, 60);

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'The email address is already verified.',
            ], 409);
        }

        if ($user->role !== 'STUDENT' || $user->status !== 'PENDING') {
            return response()->json([
                'message' => 'Email verification cannot be requested in the current account state.',
            ], 403);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Verification email sent.',
        ], 202);
    }

    /**
     * Logout.
     *
     * POST /api/auth/logout
     *
     * Invalidate only the current session. Do not destroy all user sessions.
     * Regenerate the CSRF token. Return 204 no-content.
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        // Invalidate only the current session
        $request->session()->invalidate();

        // Regenerate the CSRF token
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    /**
     * Current user.
     *
     * GET /api/auth/me
     *
     * Protected by auth:sanctum. Any authenticated account status allowed.
     * Safe representation only.
     */
    public function me()
    {
        $user = Auth::user();

        return response()->json([
            'data' => [
                'user' => $this->userRepresentation($user),
            ],
        ], 200);
    }

    /**
     * Reusable safe user representation.
     *
     * Exposes only: id, name, email, role, status, email_verified_at
     */
    private function userRepresentation($user)
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'email_verified_at' => $user->email_verified_at,
        ];
    }
}
