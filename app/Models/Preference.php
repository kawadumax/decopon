<?php

namespace App\Models;

use App\Enums\Locale;
use Illuminate\Database\Eloquent\Model;

class Preference extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        "work_time",
        "break_time",
        "locale"
    ];

    /**
     * The default values for the model's attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'work_time' => 25,
        'break_time' => 10,
        'locale' => Locale::ENGLISH,
    ];
}
