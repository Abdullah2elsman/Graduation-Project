<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_verification_verify_named_route_exists(): void
    {
        $this->assertTrue(\Illuminate\Support\Facades\Route::has('verification.verify'));
    }

    public function test_verify_email_notification_url_builds_against_the_verify_route(): void
    {
        $user = $this->createPendingUser();

        $mail = (new VerifyEmail)->toMail($user);
        $rendered = $mail->render();

        $this->assertStringContainsString(
            '/api/auth/email/verify/'.$user->getKey().'/'.sha1($user->email),
            $rendered,
        );
    }

    public function test_valid_signed_verification_marks_email_verified(): void
    {
        $user = $this->createPendingUser();

        $this->actingAs($user)
            ->getJson($this->signedUrl($user))
            ->assertRedirect(self::VERIFY_SUCCESS_URL);

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_successful_verification_redirects_to_the_configured_success_url(): void
    {
        config(['app.frontend_url' => 'http://localhost:4200']);

        $user = $this->createPendingUser();

        $this->actingAs($user)
            ->getJson($this->signedUrl($user))
            ->assertRedirect(self::VERIFY_SUCCESS_URL);
    }

    public function test_verification_keeps_status_pending(): void
    {
        $user = $this->createPendingUser();

        $this->actingAs($user)->getJson($this->signedUrl($user))
            ->assertRedirect(self::VERIFY_SUCCESS_URL);

        $this->assertSame('PENDING', $user->fresh()->status);
        $this->assertSame('STUDENT', $user->fresh()->role);
    }

    public function test_verification_does_not_alter_unrelated_lifecycle_metadata(): void
    {
        $user = $this->createPendingUser([
            'status_changed_at' => now()->subDay(),
            'status_changed_by_user_id' => null,
            'approved_at' => null,
            'approved_by_user_id' => null,
        ]);

        $before = $user->fresh()->only([
            'role', 'status', 'approved_at', 'approved_by_user_id',
            'status_changed_at', 'status_changed_by_user_id', 'status_reason',
        ]);

        $this->actingAs($user)->getJson($this->signedUrl($user))
            ->assertRedirect(self::VERIFY_SUCCESS_URL);

        $after = $user->fresh()->only(array_keys($before));

        $this->assertSame($before, $after);
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_unauthenticated_callback_cannot_verify(): void
    {
        $user = $this->createPendingUser();

        $this->getJson($this->signedUrl($user))->assertUnauthorized();

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_invalid_signature_is_rejected(): void
    {
        $user = $this->createPendingUser();

        $url = $this->signedUrl($user).'&x=tampered';

        $this->actingAs($user)->getJson($url)->assertForbidden();

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_expired_signature_is_rejected(): void
    {
        $user = $this->createPendingUser();

        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->subMinutes(5),
            ['id' => $user->getKey(), 'hash' => sha1($user->email)],
        );

        $this->actingAs($user)->getJson($url)->assertForbidden();

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_authenticated_wrong_user_id_mismatch_is_rejected(): void
    {
        $target = $this->createPendingUser();
        $intruder = $this->createPendingUser();

        $this->actingAs($intruder)
            ->getJson($this->signedUrl($target))
            ->assertForbidden();

        $this->assertNull($target->fresh()->email_verified_at);
    }

    public function test_hash_mismatch_is_rejected(): void
    {
        $user = $this->createPendingUser();

        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->getKey(), 'hash' => sha1('different@example.com')],
        );

        $this->actingAs($user)->getJson($url)->assertForbidden();

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_already_verified_account_is_handled_safely(): void
    {
        $user = $this->createPendingUser();
        $user->forceFill(['email_verified_at' => now()])->save();
        $verifiedAt = $user->fresh()->email_verified_at;

        $this->actingAs($user)->getJson($this->signedUrl($user))
            ->assertRedirect(self::VERIFY_SUCCESS_URL);

        $fresh = $user->fresh();
        $this->assertSame($verifiedAt->toJSON(), $fresh->email_verified_at->toJSON());
        $this->assertSame('PENDING', $fresh->status);
    }

    public function test_pending_unverified_user_can_resend(): void
    {
        Notification::fake();
        $user = $this->createPendingUser();

        $this->actingAs($user)
            ->postJson('/api/auth/email/verification-notification')
            ->assertAccepted();

        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_resend_returns_generic_202(): void
    {
        Notification::fake();
        $user = $this->createPendingUser();

        $response = $this->actingAs($user)
            ->postJson('/api/auth/email/verification-notification')
            ->assertAccepted();

        $this->assertArrayHasKey('message', $response->json());
    }

    public function test_verified_user_cannot_resend(): void
    {
        Notification::fake();
        $user = $this->createPendingUser();
        $user->forceFill(['email_verified_at' => now()])->save();

        $this->actingAs($user)
            ->postJson('/api/auth/email/verification-notification')
            ->assertStatus(409);

        Notification::assertNothingSent();
    }

    public function test_invalid_account_states_cannot_resend(): void
    {
        Notification::fake();

        foreach (['ACTIVE', 'SUSPENDED', 'REJECTED'] as $status) {
            $user = $this->createPendingUser(['status' => $status]);

            $this->actingAs($user)
                ->postJson('/api/auth/email/verification-notification')
                ->assertForbidden();
        }

        Notification::assertNothingSent();
    }

    public function test_guest_cannot_resend(): void
    {
        $this->postJson('/api/auth/email/verification-notification')
            ->assertUnauthorized();
    }

    public function test_resend_is_throttled(): void
    {
        Notification::fake();
        $user = $this->createPendingUser();

        for ($attempt = 0; $attempt < 3; $attempt++) {
            $this->actingAs($user)
                ->postJson('/api/auth/email/verification-notification')
                ->assertAccepted();
        }

        $this->actingAs($user)
            ->postJson('/api/auth/email/verification-notification')
            ->assertTooManyRequests()
            ->assertHeader('Retry-After');
    }

    public function test_verification_callback_is_throttled(): void
    {
        $user = $this->createPendingUser();
        $url = $this->signedUrl($user);

        for ($attempt = 0; $attempt < 6; $attempt++) {
            $this->actingAs($user)->getJson($url)
                ->assertRedirect(self::VERIFY_SUCCESS_URL);
        }

        $this->actingAs($user)->getJson($url)->assertTooManyRequests();
    }

    private const VERIFY_SUCCESS_URL = 'http://localhost:4200/auth/verify-email/success';

    private function createPendingUser(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 'STUDENT',
            'status' => 'PENDING',
            'email_verified_at' => null,
        ], $overrides));
    }

    private function signedUrl(User $user): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->getKey(), 'hash' => sha1($user->email)],
        );
    }
}
