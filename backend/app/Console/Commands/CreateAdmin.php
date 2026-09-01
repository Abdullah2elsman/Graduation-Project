<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\EmailNormalizer;
use App\Support\PasswordRules;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CreateAdmin extends Command
{
    protected $signature = 'app:create-admin';

    protected $description = 'Create the first production admin account';

    public function handle(): int
    {
        $name = $this->ask('Name');
        $email = $this->ask('Email');
        $password = $this->secret('Password');
        $confirmation = $this->secret('Confirm password');

        $normalizedEmail = EmailNormalizer::normalize($email);

        $validator = Validator::make([
            'name' => $name,
            'email' => $normalizedEmail,
            'password' => $password,
            'password_confirmation' => $confirmation,
        ], [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => PasswordRules::confirmed(),
        ]);

        $validator->after(function ($validator) use ($normalizedEmail): void {
            if (User::query()->where('email', $normalizedEmail)->exists()) {
                $validator->errors()->add(
                    'email',
                    'An account with this email already exists.',
                );
            }
        });

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        try {
            $user = DB::transaction(function () use ($validator, $normalizedEmail): User {
                if (User::query()->where('email', $normalizedEmail)->exists()) {
                    throw new \RuntimeException(
                        'An account with this email already exists.',
                    );
                }

                $user = new User();
                $user->name = $validator->validated()['name'];
                $user->email = $normalizedEmail;
                $user->password = Hash::make($validator->validated()['password']);
                $user->role = 'ADMIN';
                $user->status = 'ACTIVE';
                $user->email_verified_at = now();
                $user->approved_at = null;
                $user->approved_by_user_id = null;
                $user->status_changed_at = null;
                $user->status_changed_by_user_id = null;
                $user->status_reason = null;
                $user->created_by_user_id = null;
                $user->save();

                return $user;
            });
        } catch (\Throwable $e) {
            $this->error('Could not create the admin account.');

            return self::FAILURE;
        }

        $this->info("Admin account created for {$user->email}.");

        return self::SUCCESS;
    }
}
