<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GoldRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'metal_type_id',
        'buy_rate',
        'sell_rate',
        'effective_date',
        'created_by',
    ];

    protected $casts = [
        'buy_rate' => 'decimal:2',
        'sell_rate' => 'decimal:2',
        'effective_date' => 'date',
    ];

    public function metalType()
    {
        return $this->belongsTo(MetalType::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
