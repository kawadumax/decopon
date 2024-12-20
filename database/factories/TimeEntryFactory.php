<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use Carbon\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TimeEntry>
 */
class TimeEntryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'started_at' => now(),
            'ended_at' => null,
            'user_id' => User::factory(),
        ];
    }

    public function entry_30_minutes($started_at = null)
    {
        return $this->state(function (array $attributes) use ($started_at) {
            $start = $started_at ? Carbon::parse($started_at) : now();
            return [
                'started_at' => $start,
                'ended_at' => $start->copy()->addMinutes(30),
            ];
        });
    }
}
