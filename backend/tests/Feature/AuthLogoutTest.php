<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthLogoutTest extends TestCase
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

    public function test_logout_invalidates_the_current_session_and_returns_no_content(): void
    {
        $user = User::factory()->create([
            'email' => 'logout@example.com',
            'role' => 'STUDENT',
            'status' => 'ACTIVE',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();
        $this->withHeader('X-CSRF-TOKEN', $this->app['session']->token());

        $this->getJson('/api/auth/me')->assertOk();

        $logout = $this->postJson('/api/auth/logout');

        $logout->assertNoContent();
        $this->assertSame('', $logout->getContent());
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_guest_cannot_logout(): void
    {
        $this->postJson('/api/auth/logout')->assertUnauthorized();
    }
}
