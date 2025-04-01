<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Log;
use Illuminate\Auth\Access\HandlesAuthorization;

class LogPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Log $log)
    {
        return $user->id === $log->user_id || $user->isAdmin();
    }
}
