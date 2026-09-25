<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MadeProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'material_id',
        'supplier_id',
        'user_id',
        'unit_id',
        'order_no',
        'quantity',
        'metal_weight_used',
        'waste_weight',
        'crafting_cost',
        'status',
        'started_at',
        'completed_at',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'metal_weight_used' => 'decimal:3',
        'waste_weight' => 'decimal:3',
        'crafting_cost' => 'decimal:2',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    /**
     * The target product being crafted.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Raw Material used for crafting.
     */
    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    /**
     * Metal type / purity linked through the raw material.
     */
    public function metalType()
    {
        return $this->hasOneThrough(MetalType::class, Material::class, 'id', 'id', 'material_id', 'metal_type_id');
    }

    /**
     * Supplier from whom supplies / metals were sourced.
     */
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Craftsman / Jeweler user who crafted the piece.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
