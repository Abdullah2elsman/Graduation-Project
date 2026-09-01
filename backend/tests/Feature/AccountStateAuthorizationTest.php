<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AccountStateAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware(['auth:sanctum', 'application.access'])
            ->get('/api/_test/application-access', fn () => response()->json([
                'message' => 'Application access granted.',
            ]));
    }

    public function test_guest_cannot_access_normal_application_route(): void
    {
        $this->getJson('/api/_test/application-access')->assertUnauthorized();
    }

    public function test_active_verified_user_can_access_normal_application_route(): void
    {
        $this->assertApplicationAccess('ACTIVE', now(), 200);
    }

    public function test_active_unverified_user_cannot_access_normal_application_route(): void
    {
        $this->assertApplicationAccess('ACTIVE', null, 403);
    }

    public function test_pending_unverified_user_cannot_access_normal_application_route(): void
    {
        $this->assertApplicationAccess('PENDING', null, 403);
    }

    public function test_pending_verified_user_cannot_access_normal_application_route(): void
    {
        $this->assertApplicationAccess('PENDING', now(), 403);
    }

    public function test_suspended_user_cannot_access_normal_application_route(): void
    {
        $this->assertApplicationAccess('SUSPENDED', now(), 403);
    }

    public function test_rejected_user_cannot_access_normal_application_route(): void
    {
        $this->assertApplicationAccess('REJECTED', now(), 403);
    }

    public function test_restricted_authenticated_user_can_access_me(): void
    {
        $user = $this->createUser('SUSPENDED', now());

        $this->actingAs($user)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.status', 'SUSPENDED');
    }

    public function test_restricted_authenticated_user_can_logout(): void
    {
        $user = $this->createUser('REJECTED', now());

        $this->withHeaders([
            'Origin' => 'http://localhost:4200',
            'Referer' => 'http://localhost:4200/',
            'X-CSRF-TOKEN' => 'test-csrf-token',
        ]);
        $this->withSession(['_token' => 'test-csrf-token']);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();
        $this->withHeader('X-CSRF-TOKEN', $this->app['session']->token());

        $this->postJson('/api/auth/logout')->assertNoContent();
    }

    public function test_pending_unverified_student_can_resend_verification(): void
    {
        Notification::fake();
        $user = $this->createUser('PENDING', null);

        $this->actingAs($user)
            ->postJson('/api/auth/email/verification-notification')
            ->assertAccepted();

        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_pending_user_can_use_signed_verification_callback(): void
    {
        $user = $this->createUser('PENDING', null);
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->getKey(), 'hash' => sha1($user->email)],
        );

        $this->actingAs($user)
            ->getJson($url)
            ->assertRedirect('http://localhost:4200/auth/verify-email/success');

        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertSame('PENDING', $user->fresh()->status);
    }

    private function assertApplicationAccess(
        string $status,
        mixed $verifiedAt,
        int $expectedStatus,
    ): void {
        $user = $this->createUser($status, $verifiedAt);

        $response = $this->actingAs($user)
            ->getJson('/api/_test/application-access')
            ->assertStatus($expectedStatus);

        if ($expectedStatus === 403) {
            $response->assertExactJson([
                'message' => 'This account does not have application access.',
            ]);
        }
    }

    private function createUser(string $status, mixed $verifiedAt): User
    {
        return User::factory()->create([
            'role' => 'STUDENT',
            'status' => $status,
            'email_verified_at' => $verifiedAt,
        ]);
    }
}
