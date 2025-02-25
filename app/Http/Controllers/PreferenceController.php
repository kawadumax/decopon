<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Enums\Locale;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;

class PreferenceController extends Controller
{

    public function update(Request $request)
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

        return redirect()->route('profile.edit')->with('message', 'Preference Updated.');
    }
}
