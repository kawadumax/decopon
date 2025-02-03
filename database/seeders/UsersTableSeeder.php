<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Adminは他のシーダで行う。
        User::factory()->create([
            'name' => 'guest',
            'email' => 'guest@example.com',
            'password' => bcrypt('P@$$w0rd'),
        ]);
    }
}
