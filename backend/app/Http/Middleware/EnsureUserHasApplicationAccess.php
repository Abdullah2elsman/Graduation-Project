<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasApplicationAccess
{
    /**
     * Require a verified, active account for normal application APIs.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->hasVerifiedEmail() || $user->status !== 'ACTIVE') {
            return response()->json([
                'message' => 'This account does not have application access.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
