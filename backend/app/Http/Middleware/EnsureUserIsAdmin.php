<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->role !== 'ADMIN') {
            return response()->json([
                'message' => 'Administrator access is required.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
