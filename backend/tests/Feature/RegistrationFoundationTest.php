<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RegistrationFoundationTest extends TestCase
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

        // Disable real notification dispatch so no SMTP delivery is attempted.
        // The stock VerifyEmail notification's URL/mail construction is proven
        // separately against the real `verification.verify` route.
        Notification::fake();
    }

    public function test_valid_registration_returns_201(): void
    {
        $this->postJson('/api/auth/register', $this->validPayload())
            ->assertCreated();
    }

    public function test_user_is_persisted_as_student_pending_unverified(): void
    {
        $this->postJson('/api/auth/register', $this->validPayload())->assertCreated();

        $user = User::query()->where('email', 'student@example.com')->firstOrFail();

        $this->assertSame('STUDENT', $user->role);
        $this->assertSame('PENDING', $user->status);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_is_trimmed_and_lowercased(): void
    {
        $this->postJson('/api/auth/register', $this->validPayload([
            'email' => '  StUdEnT@ExAmPle.CoM  ',
        ]))->assertCreated();

        $user = User::query()->where('email', 'student@example.com')->first();

        $this->assertNotNull($user);
        $this->assertSame('student@example.com', $user->email);
    }

    public function test_password_is_hashed_and_not_stored_plaintext(): void
    {
        $this->postJson('/api/auth/register', $this->validPayload([
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]))->assertCreated();

        $user = User::query()->where('email', 'student@example.com')->firstOrFail();

        $this->assertNotSame('secret123', $user->password);
        $this->assertTrue(Hash::check('secret123', $user->password));
    }

    public function test_valid_password_policy_is_accepted(): void
    {
        $this->postJson('/api/auth/register', $this->validPayload([
            'password' => 'AbcDef123',
            'password_confirmation' => 'AbcDef123',
        ]))->assertCreated();

        $this->assertDatabaseHas('users', ['email' => 'student@example.com']);
    }

    public function test_password_under_8_characters_fails(): void
    {
        $this->postJson('/api/auth/register', $this->validPayload([
            'password' => 'Abc123',
            'password_confirmation' => 'Abc123',
        ]))->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->assertDatabaseMissing('users', ['email' => 'student@example.com']);
    }

    public function test_password_without_a_letter_fails(): void
    {
        $this->postJson('/api/auth/register', $this->validPayload([
            'password' => '12345678',
            'password_confirmation' => '12345678',
        ]))->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->assertDatabaseMissing('users', ['email' => 'student@example.com']);
    }

    public function test_password_without_a_number_fails(): void
    {
        $this->postJson('/api/auth/register', $this->validPayload([
            'password' => 'abcdefgh',
            'password_confirmation' => 'abcdefgh',
        ]))->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->assertDatabaseMissing('users', ['email' => 'student@example.com']);
    }

    public function test_password_confirmation_mismatch_fails(): void
    {
        $this->postJson('/api/auth/register', $this->validPayload([
            'password_confirmation' => 'different1',
        ]))->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->assertDatabaseMissing('users', ['email' => 'student@example.com']);
    }

    public function test_duplicate_email_fails_with_422(): void
    {
        User::factory()->create(['email' => 'student@example.com']);

        $this->postJson('/api/auth/register', $this->validPayload())
            ->assertUnprocessable();

        $this->assertSame(1, User::query()
            ->where('email', 'student@example.com')
            ->count());
    }

    public function test_rejected_existing_email_cannot_register(): void
    {
        User::factory()->create([
            'email' => 'rejected@example.com',
            'role' => 'STUDENT',
            'status' => 'REJECTED',
        ]);

        $this->postJson('/api/auth/register', $this->validPayload([
            'email' => 'rejected@example.com',
        ]))->assertUnprocessable();

        $this->assertSame(1, User::query()
            ->where('email', 'rejected@example.com')
            ->count());
    }

    public function test_submitted_role_status_and_verification_state_cannot_override(): void
    {
        $this->postJson('/api/auth/register', $this->validPayload([
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
            'email_verified_at' => now(),
        ]))->assertCreated();

        $user = User::query()->where('email', 'student@example.com')->firstOrFail();

        $this->assertSame('STUDENT', $user->role);
        $this->assertSame('PENDING', $user->status);
        $this->assertNull($user->email_verified_at);
    }

    public function test_successful_registration_authenticates_the_new_user(): void
    {
        $this->postJson('/api/auth/register', $this->validPayload())->assertCreated();

        $this->assertAuthenticated();
        $this->assertSame('student@example.com', $this->app['auth']->user()->email);
    }

    public function test_session_identifier_is_regenerated_after_registration(): void
    {
        $previousSessionId = $this->app['session']->getId();

        $this->postJson('/api/auth/register', $this->validPayload())->assertCreated();

        $this->assertNotSame($previousSessionId, $this->app['session']->getId());
    }

    public function test_registration_response_contains_only_safe_user_representation(): void
    {
        $response = $this->postJson('/api/auth/register', $this->validPayload([
            'name' => 'Fresh Student',
        ]))->assertCreated();

        $created = User::query()->where('email', 'student@example.com')->firstOrFail();

        $response->assertExactJson([
            'data' => [
                'user' => $this->safeRepresentation($created),
            ],
        ]);

        $response->assertJsonMissingPath('data.user.password');
        $response->assertJsonMissingPath('data.user.remember_token');
        $response->assertJsonMissingPath('data.user.last_login_at');
        $response->assertJsonMissingPath('data.user.status_reason');
    }

    public function test_email_verification_notification_is_dispatched(): void
    {
        $this->postJson('/api/auth/register', $this->validPayload())->assertCreated();

        $user = User::query()->where('email', 'student@example.com')->firstOrFail();

        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_real_verify_email_mail_and_signed_url_build_against_the_verify_route(): void
    {
        $user = User::factory()->create([
            'email' => 'student@example.com',
            'email_verified_at' => null,
        ]);

        $mail = (new VerifyEmail)->toMail($user);
        $rendered = $mail->render();

        $hash = sha1($user->getEmailForVerification());

        $this->assertStringContainsString('/api/auth/email/verify/'.$user->getKey().'/'.$hash, $rendered);
        $this->assertStringContainsString('Verify Email Address', $rendered);
    }

    public function test_registration_still_returns_201_and_establishes_session_with_verify_route_present(): void
    {
        $this->postJson('/api/auth/register', $this->validPayload())->assertCreated();

        $this->assertAuthenticated();
        $this->assertTrue(\Illuminate\Support\Facades\Route::has('verification.verify'));
    }

    public function test_registration_is_throttled(): void
    {
        for ($attempt = 0; $attempt < 3; $attempt++) {
            $this->postJson('/api/auth/register', $this->validPayload([
                'password' => 'short',
                'password_confirmation' => 'short',
            ]))->assertUnprocessable();
        }

        $this->postJson('/api/auth/register', $this->validPayload())
            ->assertTooManyRequests()
            ->assertHeader('Retry-After');
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Test Student',
            'email' => 'student@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ], $overrides);
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
