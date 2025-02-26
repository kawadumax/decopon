<?php

namespace App\Listeners;

use App\Enums\LogSource;
use App\Events\TaskCompletedEvent;
use App\Models\Log;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class AutoLogListener
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * $event->taskの情報を使ってLogレコードを作成。
     *
     * @param  \App\Events\TaskCompletedEvent  $event
     * @return void
     */
    public function handle(TaskCompletedEvent $event)
    {
        $task = $event->task;
        Log::create([
            'content' => "タスク「{$event->task->title}」が完了されました。",
            'task_id' => $task->id,
            'user_id' => \Auth::id(),
            'source' => LogSource::System
        ]);
    }
}
