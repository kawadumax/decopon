<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class MasterSeeder extends BaseSeeder
{

    public function run()
    {
        $this->createAdmin();

        if (env("APP_ENV", "local") !== 'production') {
            $this->createGuest();
        }
    }

    private function createGuest()
    {

        $email = env('GUEST_EMAIL', 'guest@example.com');
        $password = env('GUEST_PASSWORD', 'password');
        // Adminは他のシーダで行う。
        User::factory()->create([
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
