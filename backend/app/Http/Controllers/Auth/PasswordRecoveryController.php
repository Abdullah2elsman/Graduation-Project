<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\EmailNormalizer;
use App\Support\PasswordRules;
use Illuminate\Contracts\Auth\PasswordBroker as PasswordBrokerContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Timebox;

class PasswordRecoveryController extends Controller
{
    private const ACKNOWLEDGEMENT = 'If the account is eligible, a password reset link has been sent.';

    private const INVALID_TOKEN = 'The password reset token is invalid or expired.';

    public function forgot(Request $request, Timebox $timebox): JsonResponse
    {
        $request->merge([
            'email' => EmailNormalizer::normalize($request->input('email')),
        ]);

        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        return $timebox->call(function () use ($validated): JsonResponse {
            $user = User::query()->where('email', $validated['email'])->first();

            if ($user?->hasEstablishedPassword()) {
                Password::sendResetLink(['email' => $validated['email']]);
            }

            return response()->json([
                'message' => self::ACKNOWLEDGEMENT,
            ], Response::HTTP_ACCEPTED);
        }, (int) config('auth.timebox_duration', 200000));
    }

    public function reset(Request $request, Timebox $timebox): Response|JsonResponse
    {
        $request->merge([
            'email' => EmailNormalizer::normalize($request->input('email')),
        ]);

        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'token' => ['required', 'string'],
            'password' => PasswordRules::confirmed(),
        ]);

        $result = $timebox->call(function () use ($validated): string {
            $user = User::query()->where('email', $validated['email'])->first();

            if (! $user?->hasEstablishedPassword()) {
                return PasswordBrokerContract::INVALID_TOKEN;
            }

            return DB::transaction(function () use ($validated): string {
                DB::table(config('auth.passwords.'.config('auth.defaults.passwords').'.table'))
                    ->where('email', $validated['email'])
                    ->lockForUpdate()
                    ->first();

                return Password::reset(
                    [
                        'email' => $validated['email'],
                        'token' => $validated['token'],
                        'password' => $validated['password'],
                    ],
                    function (User $user, string $password): void {
                        $user->forceFill([
                            'password' => Hash::make($password),
                        ])->save();

                        DB::table(config('session.table', 'sessions'))
                            ->where('user_id', $user->getKey())
                            ->delete();
                    },
                );
            });
        }, (int) config('auth.timebox_duration', 200000));

        if ($result !== PasswordBrokerContract::PASSWORD_RESET) {
            return response()->json([
                'message' => self::INVALID_TOKEN,
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->noContent();
    }
}
