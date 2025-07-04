<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // dd('hello');
        $name = ($request->route('name'));
        if($name != 'abdullah'){
            return response()->json(["error", "Not Authenticated"], 401);
        }
        return $next($request);
    }
}
