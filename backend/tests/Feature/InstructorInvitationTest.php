<?php

namespace Tests\Feature;

use App\Actions\InstructorInvitations;
use App\Models\InstructorInvitation;
use App\Models\User;
use App\Notifications\InstructorInvitationNotification;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use RuntimeException;
use Tests\TestCase;

class InstructorInvitationTest extends TestCase
{
    use DatabaseTruncation;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(Carbon::parse('2026-09-01 12:00:00 UTC'));
        Notification::fake();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_guest_cannot_create_or_reissue_an_instructor(): void
    {
        $instructor = $this->pendingInstructor();

        $this->postJson('/api/admin/instructors', $this->identity())
            ->assertUnauthorized();
        $this->postJson($this->reissueUri($instructor))
            ->assertUnauthorized();
    }

    public function test_restricted_admin_cannot_create_or_reissue_an_instructor(): void
    {
        foreach (['PENDING', 'SUSPENDED', 'REJECTED'] as $status) {
            $admin = $this->admin(['status' => $status]);
            $instructor = $this->pendingInstructor();

            $this->actingAs($admin)
                ->postJson('/api/admin/instructors', $this->identity([
                    'email' => strtolower($status).'@example.com',
                ]))
                ->assertForbidden();
            $this->actingAs($admin)
                ->postJson($this->reissueUri($instructor))
                ->assertForbidden();
        }
    }

    public function test_active_verified_non_admin_cannot_create_or_reissue_an_instructor(): void
    {
        $nonAdmin = User::factory()->create([
            'role' => 'STUDENT',
            'status' => 'ACTIVE',
            'email_verified_at' => now(),
        ]);
        $instructor = $this->pendingInstructor();

        $this->actingAs($nonAdmin)
            ->postJson('/api/admin/instructors', $this->identity())
            ->assertForbidden();
        $this->actingAs($nonAdmin)
            ->postJson($this->reissueUri($instructor))
            ->assertForbidden();
    }

    public function test_active_verified_admin_creates_pending_instructor_and_hashed_invitation_safely(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/instructors', $this->identity([
                'email' => '  New.Instructor@Example.COM ',
            ]))
            ->assertCreated();

        $instructor = User::query()
            ->where('email', 'new.instructor@example.com')
            ->firstOrFail();
        $invitation = $instructor->instructorInvitations()->sole();
        $token = $this->latestTokenFor($instructor);

        $this->assertSame('INSTRUCTOR', $instructor->role);
        $this->assertSame('PENDING', $instructor->status);
        $this->assertNull($instructor->email_verified_at);
        $this->assertSame($admin->getKey(), $instructor->created_by_user_id);
        $this->assertNotEmpty($instructor->getRawOriginal('password'));
        $this->assertFalse(Hash::check('password', $instructor->password));
        $this->assertFalse(Hash::check($token, $instructor->password));
        $this->assertSame(now()->addDays(7)->toJSON(), $invitation->expires_at->toJSON());
        $this->assertNull($invitation->accepted_at);
        $this->assertNull($invitation->revoked_at);
        $this->assertSame(hash('sha256', $token), $invitation->getRawOriginal('token_hash'));
        $this->assertNotSame($token, $invitation->getRawOriginal('token_hash'));
        $this->assertDatabaseMissing('instructor_invitations', ['token_hash' => $token]);

        Notification::assertSentToTimes(
            $instructor,
            InstructorInvitationNotification::class,
        );

        $response->assertExactJson([
            'data' => [
                'instructor' => [
                    'id' => $instructor->id,
                    'name' => $instructor->name,
                    'email' => $instructor->email,
                    'role' => 'INSTRUCTOR',
                    'status' => 'PENDING',
                    'email_verified_at' => null,
                ],
            ],
        ]);
        $this->assertStringNotContainsString($token, $response->getContent());
        $this->assertStringNotContainsString($invitation->getRawOriginal('token_hash'), $response->getContent());
        $response->assertJsonMissingPath('data.instructor.password');
        $response->assertJsonMissingPath('data.instructor.created_by_user_id');
    }

    public function test_creation_does_not_dispatch_notification_when_outer_transaction_rolls_back(): void
    {
        $admin = $this->admin();

        try {
            DB::transaction(function () use ($admin): void {
                app(InstructorInvitations::class)->createInstructor(
                    $this->identity(),
                    $admin,
                );

                throw new RuntimeException('Force outer transaction rollback.');
            });
        } catch (RuntimeException $exception) {
            $this->assertSame(
                'Force outer transaction rollback.',
                $exception->getMessage(),
            );
        }

        Notification::assertNothingSent();
        $this->assertDatabaseMissing('users', ['email' => 'instructor@example.com']);
        $this->assertDatabaseCount('instructor_invitations', 0);
    }

    public function test_unaccepted_instructor_cannot_login_with_a_predictable_onboarding_password(): void
    {
        $admin = $this->admin();

        app(InstructorInvitations::class)->createInstructor(
            $this->identity(),
            $admin,
        );

        $this->postJson('/api/auth/login', [
            'email' => 'instructor@example.com',
            'password' => 'password',
        ])->assertUnauthorized();
    }

    public function test_duplicate_or_reserved_email_fails_with_422(): void
    {
        $admin = $this->admin();
        User::factory()->create([
            'email' => 'reserved@example.com',
            'status' => 'REJECTED',
        ]);

        $this->actingAs($admin)
            ->postJson('/api/admin/instructors', $this->identity([
                'email' => '  RESERVED@EXAMPLE.COM ',
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertSame(1, User::query()->where('email', 'reserved@example.com')->count());
        $this->assertDatabaseCount('instructor_invitations', 0);
        Notification::assertNothingSent();
    }

    public function test_invitation_email_uses_the_configured_frontend_url_and_contains_only_the_plaintext_delivery_token(): void
    {
        config(['app.frontend_url' => 'https://frontend.example.test/base/']);
        $instructor = $this->pendingInstructor();

        app(InstructorInvitations::class)->reissue($instructor);

        $notification = Notification::sent(
            $instructor,
            InstructorInvitationNotification::class,
        )->last();
        $token = $this->tokenFromNotification($notification);
        $mail = $notification->toMail($instructor);
        $rendered = $mail->render();

        $this->assertSame(
            'https://frontend.example.test/base/auth/instructor-invitations/'.$token,
            $notification->invitationUrl(),
        );
        $this->assertStringContainsString($token, $rendered);
        $this->assertStringNotContainsString(hash('sha256', $token), $rendered);
    }

    public function test_reissue_revokes_every_old_unused_invitation_and_issues_one_usable_replacement(): void
    {
        $admin = $this->admin();
        $instructor = $this->pendingInstructor();
        app(InstructorInvitations::class)->reissue($instructor);
        $oldToken = $this->latestTokenFor($instructor);
        Notification::fake();

        $this->actingAs($admin)
            ->postJson($this->reissueUri($instructor))
            ->assertAccepted()
            ->assertExactJson([
                'message' => 'If eligible, a new instructor invitation has been sent.',
            ]);

        Notification::assertSentToTimes(
            $instructor,
            InstructorInvitationNotification::class,
        );
        $newToken = $this->latestTokenFor($instructor);
        $invitations = $instructor->instructorInvitations()->oldest('id')->get();

        $this->assertCount(2, $invitations);
        $this->assertNotNull($invitations[0]->revoked_at);
        $this->assertNull($invitations[1]->revoked_at);
        $this->assertNull($invitations[1]->accepted_at);
        $this->assertNotSame($oldToken, $newToken);
        $this->assertSame(1, $instructor->instructorInvitations()
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->count());

        $this->getJson($this->validationUri($oldToken))
            ->assertOk()
            ->assertExactJson(['data' => ['usable' => false]]);
        $this->getJson($this->validationUri($newToken))
            ->assertOk()
            ->assertJsonPath('data.usable', true);
        $this->postJson($this->acceptUri($oldToken), $this->passwordPayload())
            ->assertNotFound();
    }

    public function test_reissue_does_not_dispatch_or_revoke_when_outer_transaction_rolls_back(): void
    {
        $instructor = $this->pendingInstructor();
        app(InstructorInvitations::class)->reissue($instructor);
        $originalInvitation = $instructor->instructorInvitations()->sole();
        Notification::fake();

        try {
            DB::transaction(function () use ($instructor): void {
                app(InstructorInvitations::class)->reissue($instructor);

                throw new RuntimeException('Force outer transaction rollback.');
            });
        } catch (RuntimeException $exception) {
            $this->assertSame(
                'Force outer transaction rollback.',
                $exception->getMessage(),
            );
        }

        Notification::assertNothingSent();
        $this->assertNull($originalInvitation->fresh()->revoked_at);
        $this->assertSame(1, $instructor->instructorInvitations()->count());
    }

    public function test_reissue_rejects_invalid_lifecycle_states_and_non_instructors(): void
    {
        $admin = $this->admin();
        $targets = [
            $this->pendingInstructor(['status' => 'ACTIVE', 'email_verified_at' => now()]),
            $this->pendingInstructor(['email_verified_at' => now()]),
            User::factory()->create([
                'role' => 'STUDENT',
                'status' => 'PENDING',
                'email_verified_at' => null,
            ]),
        ];

        foreach ($targets as $target) {
            $this->actingAs($admin)
                ->postJson($this->reissueUri($target))
                ->assertStatus(409);
        }

        $accepted = $this->pendingInstructor();
        InstructorInvitation::query()->create([
            'instructor_id' => $accepted->id,
            'token_hash' => hash('sha256', str_repeat('a', 64)),
            'expires_at' => now()->addDay(),
            'accepted_at' => now(),
        ]);

        $this->actingAs($this->admin())
            ->postJson($this->reissueUri($accepted))
            ->assertStatus(409);
    }

    public function test_reissue_is_throttled_to_three_attempts_per_admin_per_minute(): void
    {
        $admin = $this->admin();

        for ($attempt = 0; $attempt < 3; $attempt++) {
            $instructor = $this->pendingInstructor();

            $this->actingAs($admin)
                ->postJson($this->reissueUri($instructor))
                ->assertAccepted();
        }

        $this->actingAs($admin)
            ->postJson($this->reissueUri($this->pendingInstructor()))
            ->assertTooManyRequests()
            ->assertHeader('Retry-After');
    }

    public function test_public_validation_returns_only_minimal_state_for_a_usable_invitation(): void
    {
        $instructor = $this->pendingInstructor();
        app(InstructorInvitations::class)->reissue($instructor);
        $token = $this->latestTokenFor($instructor);
        $invitation = $instructor->instructorInvitations()->sole();

        $response = $this->getJson($this->validationUri($token))
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    'usable' => true,
                    'expires_at' => $invitation->expires_at->toJSON(),
                ],
            ]);

        $response->assertJsonMissingPath('data.email');
        $response->assertJsonMissingPath('data.instructor');
        $this->assertStringNotContainsString($token, $response->getContent());
        $this->assertStringNotContainsString($invitation->getRawOriginal('token_hash'), $response->getContent());
    }

    public function test_random_expired_revoked_and_accepted_tokens_share_the_same_safe_validation_response(): void
    {
        $expected = ['data' => ['usable' => false]];
        $states = [
            [str_repeat('1', 64), []],
            [str_repeat('2', 64), ['expires_at' => now()->subSecond()]],
            [str_repeat('3', 64), ['revoked_at' => now()]],
            [str_repeat('4', 64), ['accepted_at' => now()]],
        ];

        foreach ($states as $index => [$token, $attributes]) {
            if ($index > 0) {
                $this->storedInvitation($this->pendingInstructor(), $token, $attributes);
            }

            $this->getJson($this->validationUri($token))
                ->assertOk()
                ->assertExactJson($expected);
        }
    }

    public function test_invitation_validation_is_throttled_to_ten_requests_per_ip_per_minute(): void
    {
        $token = str_repeat('f', 64);

        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->getJson($this->validationUri($token))->assertOk();
        }

        $this->getJson($this->validationUri($token))
            ->assertTooManyRequests()
            ->assertHeader('Retry-After');
    }

    public function test_valid_acceptance_establishes_password_activates_and_consumes_without_authentication(): void
    {
        $instructor = $this->pendingInstructor();
        app(InstructorInvitations::class)->reissue($instructor);
        $token = $this->latestTokenFor($instructor);
        $invitation = $instructor->instructorInvitations()->sole();
        $other = $this->storedInvitation($instructor, str_repeat('b', 64));

        $this->postJson($this->acceptUri($token), $this->passwordPayload())
            ->assertNoContent();

        $instructor->refresh();
        $invitation->refresh();
        $other->refresh();

        $this->assertTrue(Hash::check('newpass123', $instructor->password));
        $this->assertSame('INSTRUCTOR', $instructor->role);
        $this->assertSame('ACTIVE', $instructor->status);
        $this->assertNotNull($instructor->email_verified_at);
        $this->assertNotNull($instructor->status_changed_at);
        $this->assertSame($instructor->getKey(), $instructor->status_changed_by_user_id);
        $this->assertNull($instructor->approved_at);
        $this->assertNull($instructor->approved_by_user_id);
        $this->assertSame(
            $instructor->getRawOriginal('email_verified_at'),
            $instructor->getRawOriginal('status_changed_at'),
        );
        $this->assertNotNull($invitation->accepted_at);
        $this->assertNotNull($other->revoked_at);
        $this->assertGuest();
    }

    public function test_accepted_token_is_single_use(): void
    {
        $instructor = $this->pendingInstructor();
        app(InstructorInvitations::class)->reissue($instructor);
        $token = $this->latestTokenFor($instructor);

        $this->postJson($this->acceptUri($token), $this->passwordPayload())
            ->assertNoContent();
        $acceptedAt = $instructor->instructorInvitations()->sole()->accepted_at;

        $this->postJson($this->acceptUri($token), $this->passwordPayload([
            'password' => 'different123',
            'password_confirmation' => 'different123',
        ]))->assertNotFound();

        $this->assertTrue(Hash::check('newpass123', $instructor->fresh()->password));
        $this->assertSame(
            $acceptedAt->toJSON(),
            $instructor->instructorInvitations()->sole()->accepted_at->toJSON(),
        );
    }

    public function test_invalid_expired_revoked_and_accepted_tokens_cannot_accept_without_partial_mutation(): void
    {
        $cases = [
            [str_repeat('5', 64), null, []],
            [str_repeat('6', 64), $this->pendingInstructor(), ['expires_at' => now()->subSecond()]],
            [str_repeat('7', 64), $this->pendingInstructor(), ['revoked_at' => now()]],
            [str_repeat('8', 64), $this->pendingInstructor(), ['accepted_at' => now()]],
        ];

        foreach ($cases as [$token, $instructor, $attributes]) {
            if ($instructor !== null) {
                $this->storedInvitation($instructor, $token, $attributes);
                $before = $this->lifecycleSnapshot($instructor);
            }

            $this->postJson($this->acceptUri($token), $this->passwordPayload())
                ->assertNotFound()
                ->assertExactJson([
                    'message' => 'The instructor invitation is invalid or unavailable.',
                ]);

            if ($instructor !== null) {
                $this->assertSame($before, $this->lifecycleSnapshot($instructor));
            }
        }
    }

    public function test_acceptance_enforces_frozen_password_policy_and_confirmation_without_mutation(): void
    {
        $instructor = $this->pendingInstructor();
        app(InstructorInvitations::class)->reissue($instructor);
        $token = $this->latestTokenFor($instructor);
        $before = $this->lifecycleSnapshot($instructor);
        $invalidPayloads = [
            ['password' => 'abc123', 'password_confirmation' => 'abc123'],
            ['password' => '12345678', 'password_confirmation' => '12345678'],
            ['password' => 'abcdefgh', 'password_confirmation' => 'abcdefgh'],
            ['password' => 'validpass1', 'password_confirmation' => 'different1'],
        ];

        foreach ($invalidPayloads as $payload) {
            $this->postJson($this->acceptUri($token), $payload)
                ->assertUnprocessable()
                ->assertJsonValidationErrors('password');
        }

        $this->assertSame($before, $this->lifecycleSnapshot($instructor));
        $this->assertNull($instructor->instructorInvitations()->sole()->accepted_at);
    }

    public function test_acceptance_is_throttled_to_five_requests_per_ip_per_minute(): void
    {
        $token = str_repeat('e', 64);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson($this->acceptUri($token), [])
                ->assertUnprocessable();
        }

        $this->postJson($this->acceptUri($token), [])
            ->assertTooManyRequests()
            ->assertHeader('Retry-After');
    }

    public function test_acceptance_uses_a_transaction_and_locks_both_lifecycle_rows_for_update(): void
    {
        $instructor = $this->pendingInstructor();
        app(InstructorInvitations::class)->reissue($instructor);
        $token = $this->latestTokenFor($instructor);
        $lockQueries = [];
        $userUpdatedInsideTransaction = false;

        DB::listen(function ($query) use (&$lockQueries): void {
            $sql = strtolower($query->sql);

            if (str_contains($sql, 'for update')) {
                $lockQueries[] = $sql;
            }
        });
        User::updating(function (User $user) use (&$userUpdatedInsideTransaction): void {
            if ($user->role === 'INSTRUCTOR' && $user->status === 'ACTIVE') {
                $userUpdatedInsideTransaction = DB::transactionLevel() > 0;
            }
        });

        $this->postJson($this->acceptUri($token), $this->passwordPayload())
            ->assertNoContent();

        $this->assertTrue($userUpdatedInsideTransaction);
        $this->assertTrue(collect($lockQueries)->contains(
            fn (string $sql): bool => str_contains($sql, 'from `users`'),
        ));
        $this->assertTrue(collect($lockQueries)->contains(
            fn (string $sql): bool => str_contains($sql, 'from `instructor_invitations`'),
        ));
    }

    private function admin(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
            'email_verified_at' => now(),
        ], $attributes));
    }

    private function pendingInstructor(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 'INSTRUCTOR',
            'status' => 'PENDING',
            'email_verified_at' => null,
        ], $attributes));
    }

    private function storedInvitation(
        User $instructor,
        string $token,
        array $attributes = [],
    ): InstructorInvitation {
        return InstructorInvitation::query()->create(array_merge([
            'instructor_id' => $instructor->getKey(),
            'token_hash' => hash('sha256', $token),
            'expires_at' => now()->addDays(7),
        ], $attributes));
    }

    private function latestTokenFor(User $instructor): string
    {
        $notification = Notification::sent(
            $instructor,
            InstructorInvitationNotification::class,
        )->last();

        $this->assertInstanceOf(InstructorInvitationNotification::class, $notification);

        return $this->tokenFromNotification($notification);
    }

    private function tokenFromNotification(InstructorInvitationNotification $notification): string
    {
        $path = parse_url($notification->invitationUrl(), PHP_URL_PATH);

        return basename((string) $path);
    }

    private function identity(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Test Instructor',
            'email' => 'instructor@example.com',
        ], $overrides);
    }

    private function passwordPayload(array $overrides = []): array
    {
        return array_merge([
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ], $overrides);
    }

    /**
     * @return array<string, mixed>
     */
    private function lifecycleSnapshot(User $instructor): array
    {
        $instructor->refresh();

        return [
            'password' => $instructor->getRawOriginal('password'),
            'status' => $instructor->getRawOriginal('status'),
            'email_verified_at' => $instructor->getRawOriginal('email_verified_at'),
            'approved_at' => $instructor->getRawOriginal('approved_at'),
            'approved_by_user_id' => $instructor->getRawOriginal('approved_by_user_id'),
            'status_changed_at' => $instructor->getRawOriginal('status_changed_at'),
            'status_changed_by_user_id' => $instructor->getRawOriginal('status_changed_by_user_id'),
            'status_reason' => $instructor->getRawOriginal('status_reason'),
        ];
    }

    private function reissueUri(User $instructor): string
    {
        return '/api/admin/instructors/'.$instructor->getKey().'/invitation';
    }

    private function validationUri(string $token): string
    {
        return '/api/auth/instructor-invitations/'.$token;
    }

    private function acceptUri(string $token): string
    {
        return $this->validationUri($token).'/accept';
    }
}
