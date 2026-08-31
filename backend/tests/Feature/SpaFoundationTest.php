<?php

namespace Tests\Feature;

use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Tests\TestCase;

class SpaFoundationTest extends TestCase
{
    public function test_api_routes_are_prefixed_and_return_json(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertExactJson([
                'service' => 'smart-book-api',
                'status' => 'ok',
            ]);

        $this->getJson('/api/missing')->assertNotFound();
    }

    public function test_sanctum_csrf_bootstrap_issues_csrf_and_session_cookies(): void
    {
        $this->withHeaders([
            'Accept' => 'application/json',
            'Origin' => 'http://localhost:4200',
            'Referer' => 'http://localhost:4200/',
        ])->get('/sanctum/csrf-cookie')
            ->assertNoContent()
            ->assertCookie('XSRF-TOKEN')
            ->assertCookie(config('session.cookie'));
    }

    public function test_stateful_spa_middleware_is_prepended_to_the_api_group(): void
    {
        $apiMiddleware = $this->app->make(Router::class)->getMiddlewareGroups()['api'];

        $this->assertContains(EnsureFrontendRequestsAreStateful::class, $apiMiddleware);
        $this->assertSame(['web'], config('sanctum.guard'));
        $this->assertContains('localhost:4200', config('sanctum.stateful'));
    }

    public function test_database_session_contract_and_safe_cors_configuration_are_preserved(): void
    {
        $this->assertSame('sessions', config('session.table'));
        $this->assertSame('json', config('session.serialization'));
        $this->assertSame('lax', config('session.same_site'));
        $this->assertTrue(config('session.http_only'));

        $this->assertTrue(config('cors.supports_credentials'));
        $this->assertSame(['http://localhost:4200'], config('cors.allowed_origins'));
        $this->assertNotContains('*', config('cors.allowed_origins'));
    }

    public function test_configured_frontend_origin_receives_credentialed_cors_headers(): void
    {
        $this->call('OPTIONS', '/api/health', [], [], [], [
            'HTTP_ORIGIN' => 'http://localhost:4200',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
        ])->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:4200')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
    }

    public function test_untrusted_origin_is_never_reflected_by_cors(): void
    {
        $response = $this->call('OPTIONS', '/api/health', [], [], [], [
            'HTTP_ORIGIN' => 'http://evil.example',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);

        $response->assertNoContent();
        $this->assertNotSame(
            'http://evil.example',
            $response->headers->get('Access-Control-Allow-Origin'),
        );
    }

    public function test_unauthenticated_sanctum_boundary_returns_json_unauthorized(): void
    {
        Route::middleware(['api', 'auth:sanctum'])
            ->get('/api/_foundation/protected', fn () => response()->noContent());

        $this->getJson('/api/_foundation/protected')->assertUnauthorized();
    }

    public function test_no_personal_access_token_endpoint_exists(): void
    {
        $this->postJson('/api/tokens')->assertNotFound();
    }
}
