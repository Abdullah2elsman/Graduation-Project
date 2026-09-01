<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

class InvalidStudentLifecycleTransition extends RuntimeException
{
    public function render(): JsonResponse
    {
        return response()->json([
            'message' => 'The requested student lifecycle transition is not valid.',
        ], Response::HTTP_CONFLICT);
    }
}
