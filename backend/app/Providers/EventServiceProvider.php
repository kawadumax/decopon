<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use App\Events\TaskCompletedEvent;
use App\Listeners\AutoLogListener;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        TaskCompletedEvent::class => [
            AutoLogListener::class,
        ],
        // 他のイベントとリスナもここに追加可能
    ];

    public function boot()
    {
        parent::boot();
    }
}
