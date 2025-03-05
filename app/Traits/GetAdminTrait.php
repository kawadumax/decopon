<?php

namespace App\Traits;

trait GetAdminTrait
{
    protected function getAdminEmail()
    {
        return env('ADMIN_EMAIL', 'admin@example.com');
    }

    protected function getAdminPassword()
    {
        return env('ADMIN_PASSWORD', 'password');
    }
}
