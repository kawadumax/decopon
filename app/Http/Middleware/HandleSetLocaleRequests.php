<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class HandleSetLocaleRequests
{
    public function handle(Request $request, Closure $next)
    {
        $locale = $request->user()?->locale
            ?? $request->getPreferredLanguage(['en', 'ja'])
            ?? config('app.locale');

        app()->setLocale($locale);

        return $next($request);
    }
}
