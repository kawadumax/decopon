<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    public function logs()
    {
        return $this->belongsToMany(Log::class);
    }
}
