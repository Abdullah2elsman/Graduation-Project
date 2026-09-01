<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthMeTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_me(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_pending_user_can_access_me(): void
    {
        $this->assertStatusCanAccessMe('PENDING');
    }

    public function test_active_user_can_access_me(): void
    {
        $this->assertStatusCanAccessMe('ACTIVE');
    }

    public function test_suspended_user_can_access_me(): void
    {
        $this->assertStatusCanAccessMe('SUSPENDED');
    }

    public function test_rejected_user_can_access_me(): void
    {
        $this->assertStatusCanAccessMe('REJECTED');
    }

    public function test_me_returns_only_the_safe_user_representation(): void
    {
        $user = $this->createUser('ACTIVE', [
            'name' => 'Safe User',
            'email' => 'safe@example.com',
            'role' => 'INSTRUCTOR',
            'email_verified_at' => now(),
            'last_login_at' => now(),
            'status_reason' => 'Sensitive internal reason',
        ]);

        $response = $this->actingAs($user)->getJson('/api/auth/me');

        $response->assertOk()->assertExactJson([
            'data' => [
                'user' => $this->safeRepresentation($user),
            ],
        ]);

        $response->assertJsonMissingPath('data.user.password');
        $response->assertJsonMissingPath('data.user.remember_token');
        $response->assertJsonMissingPath('data.user.last_login_at');
        $response->assertJsonMissingPath('data.user.status_reason');
    }

    private function assertStatusCanAccessMe(string $status): void
    {
        $user = $this->createUser($status);

        $this->actingAs($user)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.status', $status);
    }

    private function createUser(string $status, array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 'STUDENT',
            'status' => $status,
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
