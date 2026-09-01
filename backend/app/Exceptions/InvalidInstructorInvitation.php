<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

class InvalidInstructorInvitation extends RuntimeException
{
    public function render(): JsonResponse
    {
        return response()->json([
            'message' => 'The instructor invitation is invalid or unavailable.',
        ], Response::HTTP_NOT_FOUND);
    }
}
