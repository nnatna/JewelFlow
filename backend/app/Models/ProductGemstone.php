<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductGemstone extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'gemstone_id',
        'quantity',
        'total_carat',
        'setting_cost',
    ];

    protected $casts = [
        'total_carat' => 'decimal:2',
        'setting_cost' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function gemstone()
    {
        return $this->belongsTo(Gemstone::class);
    }
}
