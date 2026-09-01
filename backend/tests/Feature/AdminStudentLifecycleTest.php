<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminStudentLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_call_student_lifecycle_endpoints(): void
    {
        $student = $this->createStudent('PENDING', now());

        foreach ($this->lifecycleRequests($student) as [$uri, $payload]) {
            $this->postJson($uri, $payload)->assertUnauthorized();
        }
    }

    public function test_restricted_admins_cannot_call_student_lifecycle_endpoints(): void
    {
        $student = $this->createStudent('PENDING', now());

        foreach (['PENDING', 'SUSPENDED', 'REJECTED'] as $status) {
            $admin = $this->createAdmin($status, now());

            foreach ($this->lifecycleRequests($student) as [$uri, $payload]) {
                $this->actingAs($admin)->postJson($uri, $payload)->assertForbidden();
            }
        }
    }

    public function test_active_unverified_admin_cannot_call_student_lifecycle_endpoints(): void
    {
        $admin = $this->createAdmin('ACTIVE', null);
        $student = $this->createStudent('PENDING', now());

        foreach ($this->lifecycleRequests($student) as [$uri, $payload]) {
            $this->actingAs($admin)->postJson($uri, $payload)->assertForbidden();
        }
    }

    public function test_active_verified_non_admin_cannot_call_student_lifecycle_endpoints(): void
    {
        $nonAdmin = $this->createStudent('ACTIVE', now());
        $student = $this->createStudent('PENDING', now());

        foreach ($this->lifecycleRequests($student) as [$uri, $payload]) {
            $this->actingAs($nonAdmin)
                ->postJson($uri, $payload)
                ->assertForbidden()
                ->assertExactJson(['message' => 'Administrator access is required.']);
        }
    }

    public function test_active_verified_admin_can_approve_verified_pending_student(): void
    {
        $admin = $this->createAdmin();
        $student = $this->createStudent('PENDING', now());

        $this->actingAs($admin)
            ->postJson($this->approveUri($student))
            ->assertOk()
            ->assertJsonPath('data.student.status', 'ACTIVE')
            ->assertJsonMissingPath('data.student.status_reason');

        $student = $student->fresh();
        $this->assertSame('ACTIVE', $student->status);
        $this->assertNotNull($student->email_verified_at);
        $this->assertNotNull($student->approved_at);
        $this->assertSame($admin->getKey(), $student->approved_by_user_id);
        $this->assertNotNull($student->status_changed_at);
        $this->assertSame($admin->getKey(), $student->status_changed_by_user_id);
        $this->assertNull($student->status_reason);
        $this->assertSame(
            $student->getRawOriginal('approved_at'),
            $student->getRawOriginal('status_changed_at'),
        );
        $this->assertDatabaseCount('enrollments', 0);
    }

    public function test_unverified_pending_student_cannot_be_approved_without_partial_changes(): void
    {
        $admin = $this->createAdmin();
        $previousAdmin = $this->createAdmin();
        $student = $this->createStudent('PENDING', null, [
            'approved_at' => now()->subDays(3),
            'approved_by_user_id' => $previousAdmin->getKey(),
            'status_changed_at' => now()->subDays(2),
            'status_changed_by_user_id' => $previousAdmin->getKey(),
            'status_reason' => 'Existing metadata',
        ]);
        $before = $this->lifecycleMetadata($student);

        $this->actingAs($admin)
            ->postJson($this->approveUri($student))
            ->assertStatus(409)
            ->assertExactJson([
                'message' => 'The requested student lifecycle transition is not valid.',
            ]);

        $this->assertSame($before, $this->lifecycleMetadata($student->fresh()));
    }

    public function test_non_pending_student_cannot_be_approved(): void
    {
        $admin = $this->createAdmin();
        $student = $this->createStudent('ACTIVE', now());

        $this->actingAs($admin)
            ->postJson($this->approveUri($student))
            ->assertStatus(409);

        $this->assertSame('ACTIVE', $student->fresh()->status);
    }

    public function test_non_student_cannot_be_approved(): void
    {
        $admin = $this->createAdmin();
        $target = User::factory()->create([
            'role' => 'INSTRUCTOR',
            'status' => 'PENDING',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($admin)
            ->postJson($this->approveUri($target))
            ->assertStatus(409);

        $this->assertSame('PENDING', $target->fresh()->status);
    }

    public function test_pending_student_can_be_rejected_with_internal_reason(): void
    {
        $admin = $this->createAdmin();
        $student = $this->createStudent('PENDING', null);
        $reason = 'Registration details could not be verified.';

        $response = $this->actingAs($admin)
            ->postJson($this->rejectUri($student), ['reason' => $reason])
            ->assertOk()
            ->assertJsonPath('data.student.status', 'REJECTED');

        $student = $student->fresh();
        $this->assertSame('REJECTED', $student->status);
        $this->assertSame($reason, $student->status_reason);
        $this->assertNotNull($student->status_changed_at);
        $this->assertSame($admin->getKey(), $student->status_changed_by_user_id);
        $response->assertJsonMissingPath('data.student.status_reason');

        $this->actingAs($student)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.status', 'REJECTED')
            ->assertJsonMissingPath('data.user.status_reason');
    }

    public function test_rejection_reason_is_required_and_non_empty(): void
    {
        $admin = $this->createAdmin();
        $student = $this->createStudent('PENDING', null);

        $this->actingAs($admin)
            ->postJson($this->rejectUri($student))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reason');

        $this->actingAs($admin)
            ->postJson($this->rejectUri($student), ['reason' => '   '])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reason');

        $this->assertSame('PENDING', $student->fresh()->status);
    }

    public function test_non_pending_student_cannot_be_rejected(): void
    {
        $admin = $this->createAdmin();
        $student = $this->createStudent('ACTIVE', now());

        $this->actingAs($admin)
            ->postJson($this->rejectUri($student), ['reason' => 'Invalid state'])
            ->assertStatus(409);

        $this->assertSame('ACTIVE', $student->fresh()->status);
    }

    public function test_non_student_cannot_be_rejected(): void
    {
        $admin = $this->createAdmin();
        $target = User::factory()->create([
            'role' => 'INSTRUCTOR',
            'status' => 'PENDING',
            'email_verified_at' => null,
        ]);

        $this->actingAs($admin)
            ->postJson($this->rejectUri($target), ['reason' => 'Wrong role'])
            ->assertStatus(409);

        $this->assertSame('PENDING', $target->fresh()->status);
    }

    public function test_rejected_student_can_be_restored_to_unverified_pending(): void
    {
        $admin = $this->createAdmin();
        $rejectingAdmin = $this->createAdmin();
        $statusChangedAt = now()->subDay();
        $student = $this->createStudent('REJECTED', now(), [
            'approved_at' => now()->subDays(5),
            'approved_by_user_id' => $rejectingAdmin->getKey(),
            'status_changed_at' => $statusChangedAt,
            'status_changed_by_user_id' => $rejectingAdmin->getKey(),
            'status_reason' => 'Historical rejection reason',
        ]);
        $rejectionProvenance = $this->statusProvenance($student);

        $this->actingAs($admin)
            ->postJson($this->restoreUri($student))
            ->assertOk()
            ->assertJsonPath('data.student.status', 'PENDING')
            ->assertJsonPath('data.student.email_verified_at', null)
            ->assertJsonMissingPath('data.student.status_reason');

        $student = $student->fresh();
        $this->assertSame('PENDING', $student->status);
        $this->assertNotSame('ACTIVE', $student->status);
        $this->assertNull($student->email_verified_at);
        $this->assertNull($student->approved_at);
        $this->assertNull($student->approved_by_user_id);
        $restoreProvenance = $this->statusProvenance($student);
        $this->assertNotNull($restoreProvenance['status_changed_at']);
        $this->assertNotSame(
            $rejectionProvenance['status_changed_at'],
            $restoreProvenance['status_changed_at'],
        );
        $this->assertSame(
            $admin->getKey(),
            $restoreProvenance['status_changed_by_user_id'],
        );
        $this->assertNull($restoreProvenance['status_reason']);
    }

    public function test_non_rejected_student_cannot_be_restored_without_partial_changes(): void
    {
        $admin = $this->createAdmin();
        $approvingAdmin = $this->createAdmin();
        $student = $this->createStudent('ACTIVE', now(), [
            'approved_at' => now()->subDay(),
            'approved_by_user_id' => $approvingAdmin->getKey(),
            'status_changed_at' => now()->subDay(),
            'status_changed_by_user_id' => $approvingAdmin->getKey(),
        ]);
        $before = $this->lifecycleMetadata($student);

        $this->actingAs($admin)
            ->postJson($this->restoreUri($student))
            ->assertStatus(409);

        $this->assertSame($before, $this->lifecycleMetadata($student->fresh()));
    }

    public function test_non_student_cannot_be_restored(): void
    {
        $admin = $this->createAdmin();
        $target = User::factory()->create([
            'role' => 'INSTRUCTOR',
            'status' => 'REJECTED',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($admin)
            ->postJson($this->restoreUri($target))
            ->assertStatus(409);

        $this->assertSame('REJECTED', $target->fresh()->status);
    }

    private function createAdmin(string $status = 'ACTIVE', mixed $verifiedAt = null): User
    {
        return User::factory()->create([
            'role' => 'ADMIN',
            'status' => $status,
            'email_verified_at' => func_num_args() < 2 ? now() : $verifiedAt,
        ]);
    }

    private function createStudent(
        string $status,
        mixed $verifiedAt,
        array $attributes = [],
    ): User {
        return User::factory()->create(array_merge([
            'role' => 'STUDENT',
            'status' => $status,
            'email_verified_at' => $verifiedAt,
        ], $attributes));
    }

    /**
     * @return array<int, array{string, array<string, string>}>
     */
    private function lifecycleRequests(User $student): array
    {
        return [
            [$this->approveUri($student), []],
            [$this->rejectUri($student), ['reason' => 'Lifecycle test reason']],
            [$this->restoreUri($student), []],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function lifecycleMetadata(User $student): array
    {
        $student->refresh();

        return [
            'status' => $student->getRawOriginal('status'),
            'email_verified_at' => $student->getRawOriginal('email_verified_at'),
            'approved_at' => $student->getRawOriginal('approved_at'),
            'approved_by_user_id' => $student->getRawOriginal('approved_by_user_id'),
            'status_changed_at' => $student->getRawOriginal('status_changed_at'),
            'status_changed_by_user_id' => $student->getRawOriginal('status_changed_by_user_id'),
            'status_reason' => $student->getRawOriginal('status_reason'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function statusProvenance(User $student): array
    {
        $student->refresh();

        return [
            'status_changed_at' => $student->getRawOriginal('status_changed_at'),
            'status_changed_by_user_id' => $student->getRawOriginal('status_changed_by_user_id'),
            'status_reason' => $student->getRawOriginal('status_reason'),
        ];
    }

    private function approveUri(User $student): string
    {
        return '/api/admin/students/'.$student->getKey().'/approve';
    }

    private function rejectUri(User $student): string
    {
        return '/api/admin/students/'.$student->getKey().'/reject';
    }

    private function restoreUri(User $student): string
    {
        return '/api/admin/students/'.$student->getKey().'/restore-to-pending';
    }
}
