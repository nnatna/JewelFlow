<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'payable_type',
        'payable_id',
        'amount',
        'payment_method',
        'currency',
        'payment_date',
        'reference_no',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
        'status' => 'string',
    ];

    protected $attributes = [
        'currency' => 'USD',
        'status' => 'paid',
    ];

    public function payable()
    {
        return $this->morphTo();
    }
}
