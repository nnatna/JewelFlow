<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MadeProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'metal_type_id',
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
     * Metal type / purity used for crafting.
     */
    public function metalType()
    {
        return $this->belongsTo(MetalType::class);
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
