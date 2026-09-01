<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\StudentLifecycle;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentLifecycleController extends Controller
{
    public function approve(
        Request $request,
        User $student,
        StudentLifecycle $lifecycle,
    ): JsonResponse {
        return $this->studentResponse(
            $lifecycle->approve($student, $request->user()),
        );
    }

    public function reject(
        Request $request,
        User $student,
        StudentLifecycle $lifecycle,
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:2000'],
        ]);

        return $this->studentResponse(
            $lifecycle->reject($student, $request->user(), $validated['reason']),
        );
    }

    public function restoreToPending(
        Request $request,
        User $student,
        StudentLifecycle $lifecycle,
    ): JsonResponse {
        return $this->studentResponse(
            $lifecycle->restoreToPending($student, $request->user()),
        );
    }

    private function studentResponse(User $student): JsonResponse
    {
        return response()->json([
            'data' => [
                'student' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'email' => $student->email,
                    'role' => $student->role,
                    'status' => $student->status,
                    'email_verified_at' => $student->email_verified_at,
                ],
            ],
        ]);
    }
}
