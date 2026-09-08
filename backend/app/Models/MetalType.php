<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MetalType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'purity',
        'unit',
    ];

    public function goldRates()
    {
        return $this->hasMany(GoldRate::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function buybacks()
    {
        return $this->hasMany(Buyback::class);
    }
}
