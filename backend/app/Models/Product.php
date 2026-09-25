<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'material_id',
        'unit_id',
        'code_sku',
        'barcode',
        'name',
        'net_weight',
        'gross_weight',
        'labor_cost',
        'markup_rate',
        'stock_qty',
        'status',
        'image_id',
    ];

    protected $casts = [
        'net_weight' => 'decimal:2',
        'gross_weight' => 'decimal:2',
        'labor_cost' => 'decimal:2',
        'markup_rate' => 'decimal:2',
    ];

    public function unitRelation()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    public function metalType()
    {
        return $this->hasOneThrough(MetalType::class, Material::class, 'id', 'id', 'material_id', 'metal_type_id');
    }

    public function image()
    {
        return $this->belongsTo(Image::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function madeProducts()
    {
        return $this->hasMany(MadeProduct::class);
    }
}
