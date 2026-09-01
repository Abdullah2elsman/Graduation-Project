<?php

namespace App\Http\Controllers\Admin;

use App\Actions\InstructorInvitations;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\EmailNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InstructorInvitationController extends Controller
{
    public function store(
        Request $request,
        InstructorInvitations $invitations,
    ): JsonResponse {
        $request->merge([
            'email' => EmailNormalizer::normalize($request->input('email')),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        ]);

        $instructor = $invitations->createInstructor(
            $validated,
            $request->user(),
        );

        return response()->json([
            'data' => [
                'instructor' => $this->safeInstructor($instructor),
            ],
        ], Response::HTTP_CREATED);
    }

    public function reissue(
        User $instructor,
        InstructorInvitations $invitations,
    ): JsonResponse {
        $invitations->reissue($instructor);

        return response()->json([
            'message' => 'If eligible, a new instructor invitation has been sent.',
        ], Response::HTTP_ACCEPTED);
    }

    /**
     * @return array<string, mixed>
     */
    private function safeInstructor(User $instructor): array
    {
        return [
            'id' => $instructor->id,
            'name' => $instructor->name,
            'email' => $instructor->email,
            'role' => $instructor->role,
            'status' => $instructor->status,
            'email_verified_at' => $instructor->email_verified_at,
        ];
    }
}
