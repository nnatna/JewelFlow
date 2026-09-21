<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'loyalty_points',
        'total_spent',
        'tier',
        'discount_rate',
    ];

    protected $casts = [
        'total_spent' => 'decimal:2',
        'discount_rate' => 'decimal:2',
    ];

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function buybacks()
    {
        return $this->hasMany(Buyback::class);
    }
}
