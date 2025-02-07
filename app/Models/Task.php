<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Task extends Model
{
    /** @use HasFactory<\Database\Factories\TaskFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'completed',
        'parent_task_id',
    ];

    protected $casts = [
        'completed' => 'boolean',
    ];

    /**
     * タスクを所有するユーザーを取得
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 親タスクを取得
     */
    public function parentTask(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'parent_task_id');
    }

    /**
     * Taskに紐づくTagを取得
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    /**
     * サブタスクを取得
     */
    public function subTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'parent_task_id');
    }


    /**
     * あるタスクを根とする木全体のCompletedを一括で変更する関数
     */
    public function updateStatusRecursive($status): array
    {
        $updatedTasks = [];

        $this->completed = $status;
        $this->save();
        $updatedTasks[] = $this;

        foreach ($this->subTasks as $subTask) {
            $updatedTasks = array_merge($updatedTasks, $subTask->updateStatusRecursive($status));
        }

        return $updatedTasks;
    }

    public function isOwnedByUser($userId)
    {
        return $this->user_id === $userId;
    }

    public static function isValidParentTask($taskId, $userId)
    {
        $task = self::find($taskId);
        return $task && $task->isOwnedByUser($userId);
    }
}
