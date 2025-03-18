<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

class AuthenticatedSessionController extends ApiController
{
    /**
     * Display the login view.
     */
    public function create(): JsonResponse
    {
        return response()->json(
            [
                'canResetPassword' => Route::has('password.request'),
                'status' => session('status'),
            ]
        );
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // return redirect()->intended(route('dashboard', absolute: false));
        return response()->json([
            'message' => 'ログインに成功しました',
            'user' => $request->user(),
            'token' => $request->user()->createToken('auth_token')->plainTextToken,
        ], 200);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): JsonResponse
    {
        // 現在のユーザーのトークンを取り消す（Sanctumを使用している場合）
        if ($request->user()) {
            $request->user()->tokens()->delete();
        }
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // return redirect('/');
        return response()->json([
            'message' => 'ログアウトに成功しました'
        ], 200);
    }
}
