<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        Password::defaults(
            static fn() => Password::min(8) // 8文字以上であること
                ->max(255) // 255文字以下であること
                ->mixedCase() // 大文字と小文字のアルファベットを含むこと
                ->symbols() // 記号を1文字以上含むこと
                ->numbers() // 数字を1文字以上含むこと
                ->uncompromised() // 漏洩済みパスワードでないこと
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.frontend_url') . "/password-reset/$token?email={$notifiable->getEmailForPasswordReset()}";
        });
    }
}
