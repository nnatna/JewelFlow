<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Gemstone extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'shape',
        'clarity',
        'color',
        'carat_weight',
        'cost_price',
    ];

    protected $casts = [
        'carat_weight' => 'decimal:2',
        'cost_price' => 'decimal:2',
    ];

    public function productGemstones()
    {
        return $this->hasMany(ProductGemstone::class);
    }
}
