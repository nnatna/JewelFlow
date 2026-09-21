<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'min_spending',
        'discount_rate',
        'badge_color',
        'description',
        'is_active',
    ];

    protected $casts = [
        'min_spending'  => 'float',
        'discount_rate' => 'float',
        'is_active'     => 'boolean',
    ];
}
