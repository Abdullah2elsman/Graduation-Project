<?php

namespace App\Providers;

use App\Support\EmailNormalizer;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('forgot-password', function (Request $request): array {
            $email = EmailNormalizer::normalize($request->input('email'));

            return [
                Limit::perMinute(5)->by('forgot-password:ip:'.$request->ip()),
                Limit::perMinute(1)->by('forgot-password:email:'.hash('sha256', $email)),
            ];
        });

        RateLimiter::for(
            'reset-password',
            fn (Request $request): Limit => Limit::perMinute(5)
                ->by('reset-password:ip:'.$request->ip()),
        );

        ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
            $query = http_build_query([
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], '', '&', PHP_QUERY_RFC3986);

            return $frontendUrl.'/auth/reset-password?'.$query;
        });
    }
}
