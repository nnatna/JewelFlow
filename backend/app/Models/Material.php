<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    use HasFactory;

    protected $fillable = [
        'material_category_id',
        'metal_type_id',
        'supplier_id',
        'unit_id',
        'name',
        'code',
        'unit',
        'stock_qty',
        'min_stock_level',
        'cost_price',
        'use_metal_rate',
        'purity',
        'status',
        'notes',
    ];

    protected $casts = [
        'stock_qty' => 'decimal:3',
        'min_stock_level' => 'decimal:3',
        'cost_price' => 'decimal:2',
        'use_metal_rate' => 'boolean',
    ];

    public function unitRelation()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function materialCategory()
    {
        return $this->belongsTo(MaterialCategory::class, 'material_category_id');
    }

    public function metalType()
    {
        return $this->belongsTo(MetalType::class, 'metal_type_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }
}
