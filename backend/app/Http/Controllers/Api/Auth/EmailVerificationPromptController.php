<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailVerificationPromptController extends ApiController
{
    /**
     * Handle the email verification prompt.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'verified' => true,
                'message' => 'メールアドレスは既に認証されています。',
                'redirect' => route('dashboard')
            ]);
        }

        return response()->json([
            'verified' => false,
            'message' => 'メールアドレスの認証が必要です。',
            'status' => session('status')
        ]);
    }
}
