<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CustomAuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Check if the Authorization header exists
        $token = $request->header('Authorization');

        // Extract the token from the Bearer string
        if ($token && str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);

            // Verify the token (replace with your logic, e.g., database check)
            $user = \App\Models\Admin::where('api_token', $token)->first();

            if ($user) {
                // Set the authenticated user for the request
                auth()->setUser($user);
                return $next($request);
            }
        }

        // Return unauthorized response if token is invalid or missing
        return response()->json(['message' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
    }
}
