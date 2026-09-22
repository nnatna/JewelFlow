<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Store extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'phone',
        'email',
        'address',
        'vat_tin',
        'logo',
        'icon_image',
        'invoice_disclaimer',
        'is_primary',
        'is_active',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_active'  => 'boolean',
    ];

    protected $appends = [
        'logo_url',
    ];

    /**
     * Scope to filter only active stores.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get the primary / default store atelier.
     */
    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    /**
     * Get the accessible public or data URL for the store logo/icon.
     */
    public function getLogoUrlAttribute(): ?string
    {
        $logo = $this->logo ?: $this->icon_image;

        if (empty($logo)) {
            return null;
        }

        // Return Data URIs and full HTTP(S) URLs directly
        if (str_starts_with($logo, 'data:') || str_starts_with($logo, 'http://') || str_starts_with($logo, 'https://')) {
            return $logo;
        }

        $cleaned = ltrim($logo, '/');
        if (str_starts_with($cleaned, 'storage/')) {
            return asset($cleaned);
        }

        return asset('storage/' . $cleaned);
    }
}
