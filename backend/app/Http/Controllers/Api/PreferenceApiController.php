<?php

namespace App\Http\Controllers\Api;

use App\Enums\Locale;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rules\Enum;

class PreferenceApiController extends ApiController
{

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'work_time' => 'required|integer|min:1',
            'break_time' => 'required|integer|min:1',
            'locale' => ['required', new Enum(Locale::class)]
        ]);

        $request->user()->preference()->updateOrCreate(
            [],  // 条件（この場合は常に更新または作成）
            $validated
        );

        $statusCode = 200;
        return response()->json([
            'success' => true,
            'message' => 'Preference Updated.',
            'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
            'preference' => $validated,
        ], $statusCode);
    }
}
