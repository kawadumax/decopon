<?php

namespace App\Models;

use App\Enums\TimeEntryStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeEntry extends Model
{
    /** @use HasFactory<\Database\Factories\TimeEntryFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'started_at',
        'ended_at',
        'user_id',
        'status',
    ];

    protected $casts = [
        'status' => TimeEntryStatus::class,
    ];


    public function get_status_message(): string
    {
        $messages = [
            TimeEntryStatus::InProgress->value => 'フォーカスタイムは進行中です。',
            TimeEntryStatus::Completed->value => 'フォーカスタイムを完了しました。',
            TimeEntryStatus::Interrupted->value => 'フォーカスタイムを中断しました。',
            TimeEntryStatus::Abandoned->value => 'フォーカスタイムを放棄しました。',
            TimeEntryStatus::Extended->value => 'フォーカスタイムを延長しました。',
        ];

        return $messages[$this->status->value] ?? '不明なステータスに更新されました。';
    }


    /**
     * TimeEntryを所有するユーザーを取得
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
