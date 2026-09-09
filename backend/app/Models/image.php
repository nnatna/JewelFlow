<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class image extends Model
{
    protected $fillable = [
        'filename',
        'path',
        'mime_type',
        'size',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
