<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Image extends Model
{
    use HasFactory;

    protected $fillable = [
        'filename',
        'path',
        'mime_type',
        'size',
    ];

    protected $appends = ['url'];

    /**
     * Get accessible public URL for the image.
     */
    public function getUrlAttribute(): string
    {
        if (empty($this->path)) {
            return '';
        }

        if (str_starts_with($this->path, 'http://') || str_starts_with($this->path, 'https://')) {
            return $this->path;
        }

        $cleaned = ltrim($this->path, '/');
        if (str_starts_with($cleaned, 'storage/')) {
            return asset($cleaned);
        }

        return asset('storage/' . $cleaned);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
