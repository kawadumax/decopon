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

        $statusCode = 201;
        return response()->json([
            'success' => true,
            'message' => 'Focus time recording started.',
            'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
            'time_entry' => $timeEntry,
        ], $statusCode);
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
    public function update(Request $request, $id): JsonResponse
    {

        $timeEntry = TimeEntry::find($id);

        if (!$timeEntry) {
            $statusCode = 404;
            return response()->json([
                'success' => false,
                'message' => 'Time entry not found.',
                'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
            ], $statusCode);
        }

        if ($timeEntry->user_id != Auth::id()) {
            $statusCode = 403;
            return response()->json([
                'success' => false,
                'message' => 'Permission denied: You cannot update this time entry.',
                'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
            ], $statusCode);
        }

        $validatedData = $request->validate([
            'ended_at' => 'sometimes|date',
            'status' => 'sometimes|in:In_Progress,Completed,Interrupted,Abandoned,Extended',
        ]);
        $timeEntry->update($validatedData);

        $statusCode = 200;
        return response()->json([
            'success' => true,
            'message' => 'Time entry updated successfully.',
            'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
            'time_entry' => $timeEntry,
        ], $statusCode);
    }

    /**
     * 指定されたタイムエントリーを削除
     */
    public function destroy(TimeEntry $timeEntry): JsonResponse
    {
        if ($timeEntry->user_id != Auth::id()) {
            $statusCode = 403;
            return response()->json([
                'success' => false,
                'message' => 'Permission denied: You cannot delete this time entry.',
                'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
            ], $statusCode);
        }

        $timeEntry->delete();
        $statusCode = 204;
        return response()->json([
            'success' => true,
            'message' => 'Time entry deleted successfully.',
            'i18nKey' => $this->generateI18nKey(__FUNCTION__, $statusCode),
        ], $statusCode);
    }
}
