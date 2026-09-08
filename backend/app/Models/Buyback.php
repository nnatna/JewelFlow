<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Buyback extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'metal_type_id',
        'weight',
        'buyback_rate',
        'deduction_rate',
        'labor_deduction',
        'total_refund',
        'buyback_date',
    ];

    protected $casts = [
        'weight' => 'decimal:2',
        'buyback_rate' => 'decimal:2',
        'deduction_rate' => 'decimal:2',
        'labor_deduction' => 'decimal:2',
        'total_refund' => 'decimal:2',
        'buyback_date' => 'date',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function metalType()
    {
        return $this->belongsTo(MetalType::class);
    }

    public function payments()
    {
        return $this->morphMany(Payment::class, 'payable');
    }
}
