<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Instructor;
use App\Models\Student;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    // ======= Admin Login =======
    public function adminLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        // هنا بنستخدم attempt عشان السيشن تتخزن والكوكيز تتبعت
        if (Auth::guard('admin')->attempt([
            'email' => $request->email,
            'password' => $request->password
        ])) {
            $admin = Auth::guard('admin')->user();
            return response()->json([
                'user' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'role' => 'admin'
                ]
            ], 200);
        } else {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }
    }

    // ======= Student Login =======
    public function studentLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        if (Auth::guard('student')->attempt([
            'email' => $request->email,
            'password' => $request->password
        ])) {
            $student = Auth::guard('student')->user();
            return response()->json([
                'user' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'email' => $student->email,
                    'role' => 'student'
                ]
            ], 200);
        } else {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }
    }

    // ======= Instructor Login =======
    public function instructorLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        if (Auth::guard('instructor')->attempt([
            'email' => $request->email,
            'password' => $request->password
        ])) {
            $instructor = Auth::guard('instructor')->user();
            return response()->json([
                'user' => [
                    'id' => $instructor->id,
                    'name' => $instructor->name,
                    'email' => $instructor->email,
                    'role' => 'instructor'
                ]
            ], 200);
        } else {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }
    }

    // ======= Logout (works for any user) =======
    public function logout(Request $request)
    {
        // Logout from all guards
        Auth::guard('admin')->logout();
        Auth::guard('student')->logout();
        Auth::guard('instructor')->logout();

        // Invalidate session
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Successfully logged out'], 200);
    }



    // ======= Validate Token (works for any user) =======
    public function validateToken(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Invalid session'], 401);
        }

        $role = match (get_class($user)) {
            Admin::class => 'admin',
            Instructor::class => 'instructor',
            Student::class => 'student',
            default => 'unknown'
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
    // ======= Change Password (works for any user) =======
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        $user = $request->user();

        if (!$user || !Hash::check($request->current_password, $user->password)) {
            return response()->json(['error' => 'Current password is incorrect'], 401);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Password changed successfully'], 200);
    }
}
