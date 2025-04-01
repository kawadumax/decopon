<?php

namespace App\Traits;

trait GetAdminTrait
{
    protected function getAdminEmail()
    {
        return config('app.admin_email', 'admin@example.com');
    }

    protected function getAdminPassword()
    {
        return config('app.admin_password', 'password');
    }
}
