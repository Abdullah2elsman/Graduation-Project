<?php

namespace App\Http\Controllers;

use App\Support\EmailNormalizer;
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
