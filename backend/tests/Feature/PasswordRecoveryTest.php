<?php

namespace Tests\Feature;

use App\Models\InstructorInvitation;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class PasswordRecoveryTest extends TestCase
{
    use DatabaseTruncation;

    private const ACKNOWLEDGEMENT = 'If the account is eligible, a password reset link has been sent.';

    private const INVALID_TOKEN = 'The password reset token is invalid or expired.';

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(Carbon::parse('2026-09-01 12:00:00 UTC'));
        Notification::fake();
        config([
            'app.debug' => false,
            'session.driver' => 'database',
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_students_with_established_passwords_are_eligible_in_every_status(): void
    {
        foreach (['ACTIVE', 'PENDING', 'SUSPENDED', 'REJECTED'] as $status) {
            $user = $this->user([
                'email' => strtolower($status).'@example.com',
                'status' => $status,
            ]);

            $this->forgot('  '.strtoupper($user->email).'  ')
                ->assertAccepted()
                ->assertExactJson(['message' => self::ACKNOWLEDGEMENT]);

            Notification::assertSentTo($user, ResetPasswordNotification::class);
            $this->assertDatabaseHas('password_reset_tokens', ['email' => $user->email]);
        }
    }

    public function test_forgot_responses_do_not_reveal_existence_status_or_instructor_eligibility(): void
    {
        $eligible = $this->user(['email' => 'eligible@example.com']);
        $rejected = $this->user([
            'email' => 'rejected@example.com',
            'status' => 'REJECTED',
        ]);
        $suspended = $this->user([
            'email' => 'suspended@example.com',
            'status' => 'SUSPENDED',
        ]);
        $unaccepted = $this->unacceptedInstructor('unaccepted@example.com');

        $responses = [
            $this->forgot($eligible->email),
            $this->forgot('unknown@example.com'),
            $this->forgot($rejected->email),
            $this->forgot($suspended->email),
            $this->forgot($unaccepted->email),
        ];

        foreach ($responses as $response) {
            $response
                ->assertAccepted()
                ->assertExactJson(['message' => self::ACKNOWLEDGEMENT]);
        }

        $this->assertCount(1, collect($responses)->map(
            fn (TestResponse $response): array => [
                $response->getStatusCode(),
                $response->getContent(),
            ],
        )->uniqueStrict()->all());
    }

    public function test_unaccepted_instructor_gets_no_notification_or_recovery_token(): void
    {
        $instructor = $this->unacceptedInstructor();

        $response = $this->forgot($instructor->email)
            ->assertAccepted()
            ->assertExactJson(['message' => self::ACKNOWLEDGEMENT]);

        Notification::assertNotSentTo($instructor, ResetPasswordNotification::class);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $instructor->email]);
        $this->assertStringNotContainsString($instructor->email, $response->getContent());
    }

    public function test_unaccepted_instructor_cannot_use_even_a_directly_created_broker_token(): void
    {
        $instructor = $this->unacceptedInstructor();
        $originalPassword = $instructor->getRawOriginal('password');
        $token = Password::broker()->createToken($instructor);

        $this->reset($instructor->email, $token)
            ->assertUnprocessable()
            ->assertExactJson(['message' => self::INVALID_TOKEN]);

        $this->assertSame($originalPassword, $instructor->fresh()->getRawOriginal('password'));
        $this->assertTrue(Password::broker()->tokenExists($instructor, $token));
        $this->assertGuest();
    }

    public function test_forgot_validates_malformed_email_normally(): void
    {
        $this->forgot('not-an-email')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_forgot_is_throttled_to_five_requests_per_ip_per_minute(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->forgot('unknown-'.$attempt.'@example.com')
                ->assertAccepted()
                ->assertExactJson(['message' => self::ACKNOWLEDGEMENT]);
        }

        $this->forgot('unknown-final@example.com')
            ->assertTooManyRequests()
            ->assertHeader('Retry-After');
    }

    public function test_forgot_email_reissue_throttle_is_enumeration_safe(): void
    {
        $known = $this->user(['email' => 'known-throttle@example.com']);

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
            ->forgot($known->email)
            ->assertAccepted();
        $knownThrottled = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
            ->forgot('  KNOWN-THROTTLE@EXAMPLE.COM  ')
            ->assertTooManyRequests();

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])
            ->forgot('unknown-throttle@example.com')
            ->assertAccepted();
        $unknownThrottled = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])
            ->forgot('  UNKNOWN-THROTTLE@EXAMPLE.COM  ')
            ->assertTooManyRequests();

        $this->assertSame($knownThrottled->getStatusCode(), $unknownThrottled->getStatusCode());
        $this->assertSame($knownThrottled->getContent(), $unknownThrottled->getContent());
    }

    public function test_reset_succeeds_with_normalized_email_and_new_password_works_through_login(): void
    {
        $user = $this->user([
            'email' => 'reset@example.com',
            'status' => 'SUSPENDED',
            'password' => Hash::make('oldpass123'),
        ]);
        $forgot = $this->forgot('  RESET@EXAMPLE.COM  ')->assertAccepted();
        $token = $this->resetTokenSentTo($user);
        $storedToken = DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->value('token');

        $this->assertNotSame($token, $storedToken);
        $this->assertTrue(Hash::check($token, $storedToken));
        $this->assertStringNotContainsString($token, $forgot->getContent());

        $this->reset('  RESET@EXAMPLE.COM  ', $token)
            ->assertNoContent();

        $user->refresh();
        $this->assertTrue(Hash::check('newpass123', $user->password));
        $this->assertNotSame('newpass123', $user->getRawOriginal('password'));
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        $this->assertGuest();

        $this->withHeaders([
            'Origin' => 'http://localhost:4200',
            'Referer' => 'http://localhost:4200/',
            'X-CSRF-TOKEN' => 'test-csrf-token',
        ]);
        $this->withSession(['_token' => 'test-csrf-token']);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'oldpass123',
        ])->assertUnauthorized();

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'newpass123',
        ])->assertOk()->assertJsonPath('data.user.status', 'SUSPENDED');
        $this->assertAuthenticatedAs($user);
    }

    public function test_reset_token_is_single_use(): void
    {
        $user = $this->user(['email' => 'single-use@example.com']);
        $token = Password::broker()->createToken($user);

        $this->reset($user->email, $token)->assertNoContent();

        $this->reset($user->email, $token, 'different123')
            ->assertUnprocessable()
            ->assertExactJson(['message' => self::INVALID_TOKEN]);

        $this->assertTrue(Hash::check('newpass123', $user->fresh()->password));
    }

    public function test_invalid_and_expired_tokens_share_the_same_safe_failure(): void
    {
        $invalidUser = $this->user(['email' => 'invalid-token@example.com']);
        $expiredUser = $this->user(['email' => 'expired-token@example.com']);
        $expiredToken = Password::broker()->createToken($expiredUser);
        Carbon::setTestNow(now()->addMinutes(
            (int) config('auth.passwords.'.config('auth.defaults.passwords').'.expire') + 1,
        ));

        $invalid = $this->reset($invalidUser->email, 'invalid-token')
            ->assertUnprocessable()
            ->assertExactJson(['message' => self::INVALID_TOKEN]);
        $expired = $this->reset($expiredUser->email, $expiredToken)
            ->assertUnprocessable()
            ->assertExactJson(['message' => self::INVALID_TOKEN]);

        $this->assertSame($invalid->getContent(), $expired->getContent());
        $this->assertTrue(Hash::check('password', $invalidUser->fresh()->password));
        $this->assertTrue(Hash::check('password', $expiredUser->fresh()->password));
    }

    public function test_reset_enforces_the_frozen_password_policy_and_confirmation(): void
    {
        $user = $this->user(['email' => 'policy@example.com']);
        $token = Password::broker()->createToken($user);
        $payloads = [
            ['password' => 'abc123', 'password_confirmation' => 'abc123'],
            ['password' => '12345678', 'password_confirmation' => '12345678'],
            ['password' => 'abcdefgh', 'password_confirmation' => 'abcdefgh'],
            ['password' => 'validpass1'],
        ];

        foreach ($payloads as $payload) {
            $this->postJson('/api/auth/reset-password', array_merge([
                'email' => $user->email,
                'token' => $token,
            ], $payload))
                ->assertUnprocessable()
                ->assertJsonValidationErrors('password');
        }

        $this->assertTrue(Hash::check('password', $user->fresh()->password));
        $this->assertTrue(Password::broker()->tokenExists($user, $token));
    }

    public function test_reset_preserves_all_lifecycle_metadata_in_every_status(): void
    {
        $actor = $this->user([
            'email' => 'metadata-actor@example.com',
            'role' => 'ADMIN',
        ]);

        foreach (['ACTIVE', 'PENDING', 'SUSPENDED', 'REJECTED'] as $index => $status) {
            $user = $this->user([
                'email' => strtolower($status).'-metadata@example.com',
                'status' => $status,
                'email_verified_at' => $index % 2 === 0 ? now()->subDays(4) : null,
                'approved_at' => now()->subDays(3),
                'approved_by_user_id' => $actor->getKey(),
                'status_changed_at' => now()->subDays(2),
                'status_changed_by_user_id' => $actor->getKey(),
                'status_reason' => 'Preserve '.$status.' metadata',
                'created_by_user_id' => $actor->getKey(),
            ]);
            $before = $this->lifecycleSnapshot($user);
            $token = Password::broker()->createToken($user);

            $this->reset($user->email, $token)->assertNoContent();

            $this->assertSame($before, $this->lifecycleSnapshot($user));
        }
    }

    public function test_successful_reset_invalidates_all_user_database_sessions_only_and_creates_none(): void
    {
        $user = $this->user(['email' => 'sessions@example.com']);
        $other = $this->user(['email' => 'other-sessions@example.com']);
        $token = Password::broker()->createToken($user);
        $this->storeSession('user-device-one', $user);
        $this->storeSession('user-device-two', $user);
        $this->storeSession('other-device', $other);

        $this->reset($user->email, $token)->assertNoContent();

        $this->assertDatabaseMissing('sessions', ['id' => 'user-device-one']);
        $this->assertDatabaseMissing('sessions', ['id' => 'user-device-two']);
        $this->assertDatabaseHas('sessions', [
            'id' => 'other-device',
            'user_id' => $other->getKey(),
        ]);
        $this->assertDatabaseCount('sessions', 1);
        $this->assertGuest();
    }

    public function test_accepted_instructor_can_forgot_and_reset_password(): void
    {
        $instructor = $this->user([
            'email' => 'accepted-instructor@example.com',
            'role' => 'INSTRUCTOR',
            'status' => 'ACTIVE',
            'email_verified_at' => now()->subDay(),
        ]);
        InstructorInvitation::query()->create([
            'instructor_id' => $instructor->getKey(),
            'token_hash' => hash('sha256', str_repeat('a', 64)),
            'expires_at' => now()->subDay(),
            'accepted_at' => now()->subDays(2),
        ]);

        $this->forgot($instructor->email)->assertAccepted();
        $token = $this->resetTokenSentTo($instructor);

        $this->reset($instructor->email, $token)->assertNoContent();

        $this->assertTrue(Hash::check('newpass123', $instructor->fresh()->password));
        $this->assertGuest();
    }

    public function test_reset_notification_uses_the_configured_frontend_url(): void
    {
        config(['app.frontend_url' => 'https://frontend.example.test/base/']);
        $user = $this->user(['email' => 'reset-link@example.com']);

        $this->forgot($user->email)->assertAccepted();
        $notification = Notification::sent($user, ResetPasswordNotification::class)->sole();
        $expected = 'https://frontend.example.test/base/auth/reset-password?token='.
            rawurlencode($notification->token).'&email=reset-link%40example.com';

        $this->assertSame($expected, $notification->toMail($user)->actionUrl);
    }

    public function test_reset_is_throttled_to_five_requests_per_ip_per_minute(): void
    {
        $user = $this->user(['email' => 'reset-throttle@example.com']);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->reset($user->email, 'invalid-token')
                ->assertUnprocessable()
                ->assertExactJson(['message' => self::INVALID_TOKEN]);
        }

        $this->reset($user->email, 'invalid-token')
            ->assertTooManyRequests()
            ->assertHeader('Retry-After');
    }

    private function forgot(string $email): TestResponse
    {
        return $this->postJson('/api/auth/forgot-password', ['email' => $email]);
    }

    private function reset(
        string $email,
        string $token,
        string $password = 'newpass123',
    ): TestResponse {
        return $this->postJson('/api/auth/reset-password', [
            'email' => $email,
            'token' => $token,
            'password' => $password,
            'password_confirmation' => $password,
        ]);
    }

    private function user(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 'STUDENT',
            'status' => 'ACTIVE',
            'email_verified_at' => now(),
        ], $attributes));
    }

    private function unacceptedInstructor(string $email = 'unaccepted@example.com'): User
    {
        $instructor = $this->user([
            'email' => $email,
            'role' => 'INSTRUCTOR',
            'status' => 'PENDING',
            'email_verified_at' => null,
            'password' => Hash::make(bin2hex(random_bytes(32))),
        ]);

        InstructorInvitation::query()->create([
            'instructor_id' => $instructor->getKey(),
            'token_hash' => hash('sha256', str_repeat('b', 64).$instructor->getKey()),
            'expires_at' => now()->addDays(7),
        ]);

        return $instructor;
    }

    private function resetTokenSentTo(User $user): string
    {
        $notification = Notification::sent($user, ResetPasswordNotification::class)->sole();

        return $notification->token;
    }

    private function storeSession(string $id, User $user): void
    {
        DB::table('sessions')->insert([
            'id' => $id,
            'user_id' => $user->getKey(),
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Password recovery test',
            'payload' => base64_encode('session payload'),
            'last_activity' => now()->timestamp,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function lifecycleSnapshot(User $user): array
    {
        $user->refresh();

        return [
            'role' => $user->getRawOriginal('role'),
            'status' => $user->getRawOriginal('status'),
            'email_verified_at' => $user->getRawOriginal('email_verified_at'),
            'approved_at' => $user->getRawOriginal('approved_at'),
            'approved_by_user_id' => $user->getRawOriginal('approved_by_user_id'),
            'status_changed_at' => $user->getRawOriginal('status_changed_at'),
            'status_changed_by_user_id' => $user->getRawOriginal('status_changed_by_user_id'),
            'status_reason' => $user->getRawOriginal('status_reason'),
            'created_by_user_id' => $user->getRawOriginal('created_by_user_id'),
        ];
    }
}
