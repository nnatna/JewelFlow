<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'product_id',
        'gold_rate_applied',
        'weight_sold',
        'labor_fee',
        'gemstone_price',
        'unit_price',
        'quantity',
        'subtotal',
    ];

    protected $casts = [
        'gold_rate_applied' => 'decimal:2',
        'weight_sold' => 'decimal:2',
        'labor_fee' => 'decimal:2',
        'gemstone_price' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
