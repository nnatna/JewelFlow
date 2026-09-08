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
