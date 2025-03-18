<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ConfirmablePasswordController extends ApiController
{
    /**
     * Show the confirm password view.
     */
    // public function show(): Response
    // {
    //     return Inertia::render('Auth/ConfirmPassword');
    // }

    /**
     * Confirm the user's password.
     */
    public function store(Request $request): JsonResponse
    {
        if (! Auth::guard('web')->validate([
            'email' => $request->user()->email,
            'password' => $request->password,
        ])) {
            throw ValidationException::withMessages([
                'password' => __('auth.password'),
            ]);
        }

        $request->session()->put('auth.password_confirmed_at', time());

        return response()->json([
            'message' => 'パスワードが確認されました',
        ], 200);
    }
}
