<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class LoginFoundationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeaders([
            'Origin' => 'http://localhost:4200',
            'Referer' => 'http://localhost:4200/',
            'X-CSRF-TOKEN' => 'test-csrf-token',
        ]);
        $this->withSession(['_token' => 'test-csrf-token']);
    }

    public function test_active_verified_user_can_login(): void
    {
        $this->assertUserCanLogin($this->createUser([
            'email' => 'active@example.com',
            'status' => 'ACTIVE',
            'email_verified_at' => now(),
        ]));
    }

    public function test_pending_unverified_user_can_login(): void
    {
        $this->assertUserCanLogin($this->createUser([
            'email' => 'pending-unverified@example.com',
            'status' => 'PENDING',
            'email_verified_at' => null,
        ]));
    }

    public function test_pending_verified_user_can_login(): void
    {
        $this->assertUserCanLogin($this->createUser([
            'email' => 'pending-verified@example.com',
            'status' => 'PENDING',
            'email_verified_at' => now(),
        ]));
    }

    public function test_suspended_user_can_login(): void
    {
        $this->assertUserCanLogin($this->createUser([
            'email' => 'suspended@example.com',
            'status' => 'SUSPENDED',
            'email_verified_at' => now(),
        ]));
    }

    public function test_rejected_user_can_login(): void
    {
        $this->assertUserCanLogin($this->createUser([
            'email' => 'rejected@example.com',
            'status' => 'REJECTED',
            'email_verified_at' => null,
        ]));
    }

    public function test_login_normalizes_mixed_case_email(): void
    {
        $user = $this->createUser(['email' => 'mixed@example.com']);

        $this->login('MiXeD@ExAmPlE.CoM')->assertOk();
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_normalizes_surrounding_email_whitespace(): void
    {
        $user = $this->createUser(['email' => 'trimmed@example.com']);

        $this->login('  trimmed@example.com  ')->assertOk();
        $this->assertAuthenticatedAs($user);
    }

    public function test_invalid_email_and_password_return_validation_errors(): void
    {
        $this->postJson('/api/auth/login', [
            'email' => 'not-an-email',
            'password' => 'password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->postJson('/api/auth/login', [
            'email' => 'valid@example.com',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_wrong_password_returns_generic_unauthorized_response(): void
    {
        $this->createUser(['email' => 'known@example.com']);

        $this->login('known@example.com', 'wrong-password')
            ->assertUnauthorized()
            ->assertExactJson(['message' => __('auth.failed')]);
    }

    public function test_unknown_email_returns_the_same_generic_unauthorized_response(): void
    {
        $this->login('unknown@example.com', 'wrong-password')
            ->assertUnauthorized()
            ->assertExactJson(['message' => __('auth.failed')]);
    }

    public function test_successful_login_regenerates_the_session(): void
    {
        $this->createUser(['email' => 'session@example.com']);
        $this->withSession(['safety_probe' => true]);
        $previousSessionId = $this->app['session']->getId();

        $this->login('session@example.com')->assertOk();

        $this->assertNotSame($previousSessionId, $this->app['session']->getId());
    }

    public function test_successful_login_updates_last_login_at(): void
    {
        $user = $this->createUser([
            'email' => 'last-login@example.com',
            'last_login_at' => null,
        ]);

        $this->login('last-login@example.com')->assertOk();

        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_failed_login_does_not_update_last_login_at(): void
    {
        $user = $this->createUser([
            'email' => 'failed-login@example.com',
            'last_login_at' => null,
        ]);

        $this->login('failed-login@example.com', 'wrong-password')->assertUnauthorized();

        $this->assertNull($user->fresh()->last_login_at);
    }

    public function test_login_response_contains_only_the_safe_user_representation(): void
    {
        $user = $this->createUser([
            'name' => 'Response User',
            'email' => 'response@example.com',
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
            'email_verified_at' => now(),
            'status_reason' => 'Internal only',
        ]);

        $this->login('response@example.com')->assertOk()->assertExactJson([
            'data' => [
                'user' => $this->safeRepresentation($user),
            ],
        ]);
    }

    public function test_sixth_failed_attempt_is_throttled_for_normalized_email_and_ip(): void
    {
        $this->createUser(['email' => 'throttle@example.com']);

        foreach ([
            'THROTTLE@example.com',
            ' throttle@example.com ',
            'Throttle@Example.Com',
            'throttle@example.com',
            '  THROTTLE@EXAMPLE.COM',
        ] as $email) {
            $this->login($email, 'wrong-password')->assertUnauthorized();
        }

        $this->login('throttle@example.com', 'wrong-password')
            ->assertTooManyRequests()
            ->assertHeader('Retry-After');
    }

    public function test_unknown_email_is_throttled_without_leaking_account_existence(): void
    {
        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->login('missing@example.com', 'wrong-password')
                ->assertUnauthorized()
                ->assertExactJson(['message' => __('auth.failed')]);
        }

        $this->login('missing@example.com', 'wrong-password')->assertTooManyRequests();
    }

    public function test_successful_login_clears_failed_attempt_state(): void
    {
        $this->createUser(['email' => 'clear@example.com']);

        for ($attempt = 1; $attempt <= 4; $attempt++) {
            $this->login('clear@example.com', 'wrong-password')->assertUnauthorized();
        }

        $this->login('clear@example.com')->assertOk();
        $this->withHeader('X-CSRF-TOKEN', $this->app['session']->token());

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->login('clear@example.com', 'wrong-password')->assertUnauthorized();
        }

        $this->login('clear@example.com', 'wrong-password')->assertTooManyRequests();
    }

    public function test_validation_failures_do_not_consume_credential_attempts(): void
    {
        $this->createUser(['email' => 'validation@example.com']);

        for ($attempt = 1; $attempt <= 6; $attempt++) {
            $this->postJson('/api/auth/login', [
                'email' => 'validation@example.com',
            ])->assertUnprocessable()->assertJsonValidationErrors('password');
        }

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->login('validation@example.com', 'wrong-password')->assertUnauthorized();
        }

        $this->login('validation@example.com', 'wrong-password')->assertTooManyRequests();
    }

    public function test_failed_attempts_are_scoped_by_client_ip(): void
    {
        $this->createUser(['email' => 'ip@example.com']);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
                ->login('ip@example.com', 'wrong-password')
                ->assertUnauthorized();
        }

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])
            ->login('ip@example.com', 'wrong-password')
            ->assertUnauthorized();
    }

    private function assertUserCanLogin(User $user): void
    {
        $this->login($user->email)
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    'user' => $this->safeRepresentation($user),
                ],
            ]);

        $this->assertAuthenticatedAs($user);
    }

    private function login(string $email, string $password = 'password'): TestResponse
    {
        return $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => $password,
        ]);
    }

    private function createUser(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 'STUDENT',
            'status' => 'ACTIVE',
            'last_login_at' => null,
        ], $attributes));
    }

    private function safeRepresentation(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'email_verified_at' => $user->email_verified_at?->toJSON(),
        ];
    }
}
