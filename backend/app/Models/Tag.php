<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'user_id'
    ];

    public function logs()
    {
        return $this->belongsToMany(Log::class);
    }

    public function tasks()
    {
        return $this->belongsToMany(Task::class);
    }
}
