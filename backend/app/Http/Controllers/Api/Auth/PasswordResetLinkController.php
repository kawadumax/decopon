<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class PasswordResetLinkController extends ApiController
{
    /**
     * Display the password reset link request view.
     */
    public function create(): JsonResponse
    {
        // return Inertia::render('Auth/ForgotPassword', );
        return response()->json([
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'email' => 'required|email',
            ]);

            $status = Password::sendResetLink(
                $request->only('email')
            );

            if ($status == Password::RESET_LINK_SENT) {
                return response()->json([
                    'message' => __($status),
                ], 200);
            }

            throw ValidationException::withMessages([
                'email' => [trans($status)],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => '入力エラーがあります。',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'パスワードリセットリンクの送信中にエラーが発生しました。',
            ], 500);
        }
    }
}
