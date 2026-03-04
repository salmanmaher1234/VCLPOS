<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'customer_id',
        'employee_id',
        'receipt_number',
        'total_amount',
        'paid_amount',
        'tax_rate',
        'tax_amount',
        'discount_amount',
        'payment_method',
        'status',
        'notes',
    ];

    protected static function booted()
    {
        static::addGlobalScope('user', function ($builder) {
            if (auth()->check()) {
                $builder->where('user_id', auth()->id());
            }
        });

        static::creating(function ($sale) {
            if (empty($sale->receipt_number)) {
                $sale->receipt_number = static::generateReceiptNumber();
            }
        });
    }

    /**
     * Generate a unique receipt number in format: RCP-DDMMYYYY-XXXX
     */
    public static function generateReceiptNumber()
    {
        $date = now()->format('dmY');
        $prefix = "RCP-{$date}-";

        // Use raw DB query to be absolutely sure we see all records
        $lastReceipt = \Illuminate\Support\Facades\DB::table('sales')
            ->where('receipt_number', 'like', $prefix . '%')
            ->where('user_id', auth()->id())
            ->orderBy('id', 'desc') // Order by ID to get the absolute latest created
            ->first();

        if ($lastReceipt) {
            $lastNumber = (int) substr($lastReceipt->receipt_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        $receiptNumber = $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);

        // Double check uniqueness (just in case)
        while (\Illuminate\Support\Facades\DB::table('sales')->where('receipt_number', $receiptNumber)->exists()) {
            $newNumber++;
            $receiptNumber = $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
        }

        return $receiptNumber;
    }

    /**
     * Get subtotal (before tax and discount)
     */
    public function getSubtotalAttribute()
    {
        return $this->items->sum('total');
    }

    /**
     * Get grand total (after tax and discount)
     */
    public function getGrandTotalAttribute()
    {
        return $this->total_amount + $this->tax_amount - $this->discount_amount;
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
