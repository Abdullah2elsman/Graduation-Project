<?php

namespace App\Http\Controllers\Auth;

use App\Actions\InstructorInvitations;
use App\Http\Controllers\Controller;
use App\Support\PasswordRules;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InstructorInvitationController extends Controller
{
    public function show(
        string $token,
        InstructorInvitations $invitations,
    ): JsonResponse {
        $invitation = $invitations->usableInvitation($token);

        if ($invitation === null) {
            return response()->json([
                'data' => ['usable' => false],
            ]);
        }

        return response()->json([
            'data' => [
                'usable' => true,
                'expires_at' => $invitation->expires_at,
            ],
        ]);
    }

    public function accept(
        Request $request,
        string $token,
        InstructorInvitations $invitations,
    ): Response {
        $validated = $request->validate([
            'password' => PasswordRules::confirmed(),
        ]);

        $invitations->accept($token, $validated['password']);

        return response()->noContent();
    }
}
