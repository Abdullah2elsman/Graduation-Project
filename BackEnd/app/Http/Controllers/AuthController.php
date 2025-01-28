<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Instructor;
use App\Models\Student;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:8',
            'role' => 'required|in:student,admin,instructor',
        ]);

        // Determine the user model based on the role
        switch ($request->role) {
            case 'student':
                $userModel = Student::class;
                $tokenName = 'Student';
                break;
            case 'admin':
                $userModel = Admin::class;
                $tokenName = 'Admin';
                break;
            case 'instructor':
                $userModel = Instructor::class;
                $tokenName = 'Instructor';
                break;
            default:
                return response()->json(['error' => 'Invalid role specified'], 400);
        }

        // Retrieve the user by email
        $user = $userModel::where('email', $request->email)->first();
        
        // Check if the user exists and the password is correct
        if ($user && $request->password === $user->password) {
            // Generate token
            $token = $user->createToken($tokenName)->plainTextToken;

            return response()->json(['token' => $token], 200);
        } else {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }
    }

    function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                match ($request['role']) {
                    'student' => 'unique:students,email',
                    'admin' => 'unique:admins,email',
                    'instructor' => 'unique:instructors,email',
                    default => throw new Exception('Invalid role specified'),
                },
            ],
            'password' => 'required|min:8',
            'role' => 'required|in:student,admin,instructor',
        ]);
        switch ($request['role']) {
            case 'student':
                $user = new Student();
                $tokenName = 'Student';
                break;
            case 'admin':
                $user = new Admin();
                $tokenName = 'Admin';
                break;
            case 'instructor':
                $user = new Instructor();
                $tokenName = 'Instructor';
                break;
            default:
                throw new Exception('Invalid role specified');
        }


        $user = $user::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'role' => $request->role
        ]);

        $token = $user->createToken($tokenName)->plainTextToken;

        return response()->json(['token' => $token], 200);
    }

    public function validateToken(Request $request)
    {
        if ($request->user()) {
            return response()->json([
                'message' => 'Token is valid',
                'user' => $request->user(), // Return the authenticated user's details
            ], 200);
        }

        return response()->json(['message' => 'Invalid token'], 401);
    }
}
