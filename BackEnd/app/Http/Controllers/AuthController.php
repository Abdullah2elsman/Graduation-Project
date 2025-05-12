<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Instructor;
use App\Models\Student;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|min:8',
            'role' => 'required|in:student,admin,instructor',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        $model = match ($request->role) {
            'student' => Student::class,
            'admin' => Admin::class,
            'instructor' => Instructor::class,
        };

        $user = $model::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('authToken', [$request->role])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $request->role
            ]
        ], 200);
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
                break;
            case 'admin':
                $user = new Admin();
                break;
            case 'instructor':
                $user = new Instructor();
                break;
            default:
                throw new Exception('Invalid role specified');
        }


        $createdUser = $user::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'user' => [
                'id' => $createdUser->id,
                'name' => $createdUser->name,
                'email' => $createdUser->email,
                'role' => $request->role
            ]
        ], 201);
    }

    public function validateToken(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Invalid token'], 401);
        }

        $role = match (get_class($user)) {
            Admin::class => 'admin',
            Instructor::class => 'instructor',
            Student::class => 'student',
            default => throw new \Exception('Unknown user type')
        };

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $role
            ]
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Successfully logged out'], 200);
    }
}
