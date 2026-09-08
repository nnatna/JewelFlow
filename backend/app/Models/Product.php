<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'metal_type_id',
        'code_sku',
        'barcode',
        'name',
        'net_weight',
        'gross_weight',
        'labor_cost',
        'markup_rate',
        'stock_qty',
        'status',
    ];

    protected $casts = [
        'net_weight' => 'decimal:2',
        'gross_weight' => 'decimal:2',
        'labor_cost' => 'decimal:2',
        'markup_rate' => 'decimal:2',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function metalType()
    {
        return $this->belongsTo(MetalType::class);
    }

    public function productGemstones()
    {
        return $this->hasMany(ProductGemstone::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }
}
