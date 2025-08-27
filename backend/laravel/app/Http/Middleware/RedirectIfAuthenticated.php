<?php

namespace App\Http\Middleware;

use App\Providers\RouteServiceProvider;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * @param  \Illuminate\Http\Request  $request  受信したリクエスト
     * @param  \Closure  $next  次に呼び出すミドルウェア
     * @param  string ...$guards  使用する認証ガード（複数指定可能）
     * @return \Symfony\Component\HttpFoundation\Response  返すレスポンス
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            // ユーザーが認証中かどうか？
            if (Auth::guard($guard)->check()) {
                if ($request->expectsJson()) {
                    // リクエストがJSONを期待している場合、認証済みであることを示すJSONレスポンスを返します。
                    return response()->json([
                        'message' => 'You are already authenticated.',
                        'user' => Auth::user()
                    ], 200);
                }

                // ユーザーが認証済みでJSONを期待していない場合、ホームページにリダイレクトします。
                return redirect("/");
            }
        }

        // ユーザーが認証されていない場合、リクエストを次のミドルウェアに進めます。
        return $next($request);
    }
}
