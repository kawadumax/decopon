<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class MasterSeeder extends Seeder
{
    public function run()
    {
        $email = env('ADMIN_EMAIL', '***REMOVED***');
        $password = env('ADMIN_PASSWORD', 'password');

        User::updateOrCreate(
            ['email' => $email], // 一意の条件
            [
                'name' => 'admin',
                'email' => $email,
                'password' => Hash::make($password),
            ]
        );
    }
}
