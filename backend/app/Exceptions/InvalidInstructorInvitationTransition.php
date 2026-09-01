<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

class InvalidInstructorInvitationTransition extends RuntimeException
{
    public function render(): JsonResponse
    {
        return response()->json([
            'message' => 'The requested instructor invitation transition is not valid.',
        ], Response::HTTP_CONFLICT);
    }
}
