<?php

namespace App\Actions\Admin;

use App\Exceptions\InvalidStudentLifecycleTransition;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StudentLifecycle
{
    public function approve(User $student, User $admin): User
    {
        return DB::transaction(function () use ($student, $admin): User {
            $student = $this->lockStudent($student);

            if (
                $student->role !== 'STUDENT'
                || $student->status !== 'PENDING'
                || ! $student->hasVerifiedEmail()
            ) {
                $this->invalidTransition();
            }

            $transitionedAt = now();

            $student->forceFill([
                'status' => 'ACTIVE',
                'approved_at' => $transitionedAt,
                'approved_by_user_id' => $admin->getKey(),
                'status_changed_at' => $transitionedAt,
                'status_changed_by_user_id' => $admin->getKey(),
                'status_reason' => null,
            ])->save();

            return $student->refresh();
        });
    }

    public function reject(User $student, User $admin, string $reason): User
    {
        return DB::transaction(function () use ($student, $admin, $reason): User {
            $student = $this->lockStudent($student);

            if ($student->role !== 'STUDENT' || $student->status !== 'PENDING') {
                $this->invalidTransition();
            }

            $student->forceFill([
                'status' => 'REJECTED',
                'status_changed_at' => now(),
                'status_changed_by_user_id' => $admin->getKey(),
                'status_reason' => $reason,
            ])->save();

            return $student->refresh();
        });
    }

    public function restoreToPending(User $student, User $admin): User
    {
        return DB::transaction(function () use ($student, $admin): User {
            $student = $this->lockStudent($student);

            if ($student->role !== 'STUDENT' || $student->status !== 'REJECTED') {
                $this->invalidTransition();
            }

            $student->forceFill([
                'status' => 'PENDING',
                'email_verified_at' => null,
                'approved_at' => null,
                'approved_by_user_id' => null,
                'status_changed_at' => now(),
                'status_changed_by_user_id' => $admin->getKey(),
                'status_reason' => null,
            ])->save();

            return $student->refresh();
        });
    }

    private function lockStudent(User $student): User
    {
        return User::query()->lockForUpdate()->findOrFail($student->getKey());
    }

    private function invalidTransition(): never
    {
        throw new InvalidStudentLifecycleTransition;
    }
}
