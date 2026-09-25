<?php

namespace Database\Factories;

use App\Models\Image;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Image>
 */
class ImageFactory extends Factory
{
    protected $model = Image::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $unsplashUrls = [
            'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=800&q=80', // Traditional Luxury Gold Necklace / Bridal
            'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80', // Pailin Ruby & Gold Pendant
            'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80', // 24K Khmer Style Gold Ring
            'https://images.unsplash.com/photo-1611591475880-994bb0fd6300?auto=format&fit=crop&w=800&q=80', // 24K Solid Gold Chain
            'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80', // Handcrafted Gold Bangles & Bracelets
            'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80', // Royal Gold Drop Earrings
            'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80', // Khmer Wedding Gold Set
            'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80', // Fine Yellow Gold Bullion & Atelier Jewelry
            'https://images.unsplash.com/photo-1629224316810-9d8805b95e76?auto=format&fit=crop&w=800&q=80', // Pure Gold Necklace and Earrings
            'https://images.unsplash.com/photo-1598560917505-59a3ad559071?auto=format&fit=crop&w=800&q=80', // Pailin Sapphire & Gold Ring
        ];

        return [
            'filename'  => fake()->word() . '.jpg',
            'path'      => fake()->randomElement($unsplashUrls),
            'mime_type' => 'image/jpeg',
            'size'      => fake()->numberBetween(10240, 524288),
        ];
    }
}
