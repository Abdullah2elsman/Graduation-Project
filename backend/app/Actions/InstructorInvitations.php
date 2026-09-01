<?php

namespace App\Actions;

use App\Exceptions\InvalidInstructorInvitation;
use App\Exceptions\InvalidInstructorInvitationTransition;
use App\Models\InstructorInvitation;
use App\Models\User;
use App\Notifications\InstructorInvitationNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class InstructorInvitations
{
    private const TOKEN_BYTES = 32;

    private const LIFETIME_DAYS = 7;

    /**
     * @param  array{name: string, email: string}  $identity
     */
    public function createInstructor(array $identity, User $admin): User
    {
        return DB::transaction(function () use ($identity, $admin): User {
            $instructor = User::query()->forceCreate([
                'name' => $identity['name'],
                'email' => $identity['email'],
                'password' => Hash::make(bin2hex(random_bytes(self::TOKEN_BYTES))),
                'role' => 'INSTRUCTOR',
                'status' => 'PENDING',
                'email_verified_at' => null,
                'approved_at' => null,
                'approved_by_user_id' => null,
                'status_changed_at' => null,
                'status_changed_by_user_id' => null,
                'status_reason' => null,
                'created_by_user_id' => $admin->getKey(),
                'last_login_at' => null,
            ]);

            $this->issue($instructor);

            return $instructor->refresh();
        });
    }

    public function reissue(User $instructor): void
    {
        DB::transaction(function () use ($instructor): void {
            $instructor = User::query()
                ->lockForUpdate()
                ->findOrFail($instructor->getKey());

            if (! $this->isExpectedOnboardingState($instructor)
                || $instructor->instructorInvitations()->whereNotNull('accepted_at')->exists()) {
                throw new InvalidInstructorInvitationTransition;
            }

            $revokedAt = now();

            $instructor->instructorInvitations()
                ->whereNull('accepted_at')
                ->whereNull('revoked_at')
                ->update(['revoked_at' => $revokedAt]);

            $this->issue($instructor);
        });
    }

    public function usableInvitation(string $token): ?InstructorInvitation
    {
        $invitation = $this->findByToken($token);

        if ($invitation === null
            || $invitation->accepted_at !== null
            || $invitation->revoked_at !== null
            || ! $invitation->expires_at->isFuture()
            || ! $this->isExpectedOnboardingState($invitation->instructor)
            || $invitation->instructor->instructorInvitations()->whereNotNull('accepted_at')->exists()) {
            return null;
        }

        return $invitation;
    }

    public function accept(string $token, string $password): void
    {
        $candidate = $this->findByToken($token);

        if ($candidate === null) {
            throw new InvalidInstructorInvitation;
        }

        DB::transaction(function () use ($candidate, $token, $password): void {
            $instructor = User::query()
                ->lockForUpdate()
                ->findOrFail($candidate->instructor_id);

            $invitation = InstructorInvitation::query()
                ->lockForUpdate()
                ->find($candidate->getKey());

            $tokenHash = $this->hashToken($token);

            if ($invitation === null
                || ! hash_equals($invitation->token_hash, $tokenHash)
                || $invitation->accepted_at !== null
                || $invitation->revoked_at !== null
                || ! $invitation->expires_at->isFuture()
                || ! $this->isExpectedOnboardingState($instructor)
                || $instructor->instructorInvitations()->whereNotNull('accepted_at')->exists()) {
                throw new InvalidInstructorInvitation;
            }

            $acceptedAt = now();

            $instructor->forceFill([
                'password' => Hash::make($password),
                'email_verified_at' => $acceptedAt,
                'status' => 'ACTIVE',
                'approved_at' => null,
                'approved_by_user_id' => null,
                'status_changed_at' => $acceptedAt,
                'status_changed_by_user_id' => $instructor->getKey(),
                'status_reason' => null,
            ])->save();

            $invitation->forceFill(['accepted_at' => $acceptedAt])->save();

            $instructor->instructorInvitations()
                ->whereKeyNot($invitation->getKey())
                ->whereNull('accepted_at')
                ->whereNull('revoked_at')
                ->update(['revoked_at' => $acceptedAt]);
        });
    }

    private function issue(User $instructor): InstructorInvitation
    {
        $token = bin2hex(random_bytes(self::TOKEN_BYTES));
        $expiresAt = now()->addDays(self::LIFETIME_DAYS);

        $invitation = InstructorInvitation::query()->create([
            'instructor_id' => $instructor->getKey(),
            'token_hash' => $this->hashToken($token),
            'expires_at' => $expiresAt,
        ]);

        DB::afterCommit(function () use ($instructor, $token, $expiresAt): void {
            $instructor->notify(new InstructorInvitationNotification($token, $expiresAt));
        });

        return $invitation;
    }

    private function findByToken(string $token): ?InstructorInvitation
    {
        if (strlen($token) !== self::TOKEN_BYTES * 2 || ! ctype_xdigit($token)) {
            return null;
        }

        $tokenHash = $this->hashToken($token);
        $invitation = InstructorInvitation::query()
            ->with('instructor')
            ->where('token_hash', $tokenHash)
            ->first();

        if ($invitation === null || ! hash_equals($invitation->token_hash, $tokenHash)) {
            return null;
        }

        return $invitation;
    }

    private function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    private function isExpectedOnboardingState(User $instructor): bool
    {
        return $instructor->role === 'INSTRUCTOR'
            && $instructor->status === 'PENDING'
            && ! $instructor->hasVerifiedEmail();
    }
}
