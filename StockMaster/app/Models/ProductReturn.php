<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductReturn extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
        'customer_name',
        'quantity',
        'return_type',
        'refund_amount',
        'reason',
        'rejection_reason',
        'status',
        'approved_by',
        'approved_at',
        'refund_paid',
        'refund_paid_at',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
