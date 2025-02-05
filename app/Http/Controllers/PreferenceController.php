<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PreferenceController extends Controller
{

    public function update(Request $request)
    {
        $validated = $request->validate([
            'work_time' => 'required|integer|min:1',
            'break_time' => 'required|integer|min:1',
        ]);

        $request->user()->preference()->updateOrCreate(
            [],  // 条件（この場合は常に更新または作成）
            $validated
        );

        return redirect()->route('profile.edit')->with('message', '設定を更新しました。');
    }
}
