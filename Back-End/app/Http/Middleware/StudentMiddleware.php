<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::guard('sanctum')->check() && Auth::user()->role === 'student') {
            return $next($request);
        }

        return response()->json(['error' => 'Unauthorized'], 403);
    }
}
