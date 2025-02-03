<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TimeEntry;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class TimeEntryApiController extends ApiController
{
    /**
     * タイムエントリーの一覧を取得
     */
    public function index(): JsonResponse
    {
        // ログイン中のユーザの内容のみ閲覧可
        $timeEntries = TimeEntry::where('user_id', Auth::id())->get();
        return response()->json($timeEntries);
    }

    /**
     * 新しいタイムエントリーを作成
     */
    public function store(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'started_at' => 'required|date',
            'ended_at' => 'nullable|date|after:started_at',
            'status' => 'required|in:In_Progress,Completed,Interrupted,Abandoned,Extended',
        ]);

        $timeEntry = new TimeEntry($validatedData);
        $timeEntry->user_id = Auth::id();
        $timeEntry->save();
        return response()->json([
            'success' => true,
            'message' => "フォーカスタイムを記録開始しました",
            'data' => $timeEntry
        ], 201);
    }

    /**
     * 指定されたタイムエントリーを取得
     */
    public function show(TimeEntry $timeEntry): JsonResponse
    {
        return response()->json($timeEntry);
    }

    /**
     * 指定されたタイムエントリーを更新
     */
    public function update(Request $request, TimeEntry $timeEntry): JsonResponse
    {
        if ($timeEntry->user_id != Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'このタイムエントリーを更新する権限がありません。',
            ], 403);
        }

        $validatedData = $request->validate([
            'started_at' => 'sometimes|required|date',
            'ended_at' => 'sometimes|required|date|after:started_at',
            'status' => 'sometimes|required|in:In_Progress,Completed,Interrupted,Abandoned,Extended',
        ]);
        $timeEntry->update($validatedData);
        return response()->json($timeEntry);
    }

    /**
     * 指定されたタイムエントリーを削除
     */
    public function destroy(TimeEntry $timeEntry): JsonResponse
    {
        if ($timeEntry->user_id != Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'このタイムエントリーを削除する権限がありません。',
            ], 403);
        }

        $timeEntry->delete();
        return response()->json(null, 204);
    }
}
