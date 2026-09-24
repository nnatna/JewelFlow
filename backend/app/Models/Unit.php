<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_kh',
        'code',
        'symbol',
        'conversion_factor',
        'base_unit',
        'type',
        'sort_order',
        'is_active',
        'description',
    ];

    protected $casts = [
        'conversion_factor' => 'decimal:6',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Convert an amount in this unit to grams.
     */
    public function toGrams(float $amount): float
    {
        return $amount * (float) $this->conversion_factor;
    }

    /**
     * Convert an amount in grams to this unit.
     */
    public function fromGrams(float $grams): float
    {
        $factor = (float) $this->conversion_factor;
        return $factor > 0 ? $grams / $factor : 0.0;
    }

    public function materials()
    {
        return $this->hasMany(Material::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function madeProducts()
    {
        return $this->hasMany(MadeProduct::class);
    }

    public function buybacks()
    {
        return $this->hasMany(Buyback::class);
    }
}
