<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class MasterSeeder extends BaseSeeder
{

    public function run()
    {
        $this->createAdmin();

        if (config('app.env') !== 'production') {
            $this->createGuest();
        }
    }

    private function createGuest()
    {

        $email = config('app.guest_email', 'guest@example.com');
        $password = config('app.guest_password', 'password');
        // Adminは他のシーダで行う。
        User::updateOrCreate(['email' => $email], [
            'name' => 'guest',
            'email' => $email,
            'password' => Hash::make($password),
        ]);
    }

    private function createAdmin()
    {
        $email = $this->getAdminEmail();
        $password = $this->getAdminPassword();

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
