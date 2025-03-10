<?php

namespace Tests\Feature;

use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeEntryApiTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function testGetCycle()
    {
        $date = '2023-05-15';
        $response = $this->actingAs($this->user)->getJson("/api/time-entries/cycle?date={$date}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'cycles',
                'message',
                'i18nKey'
            ]);
    }
}
