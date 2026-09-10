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
            'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1611591475880-994bb0fd6300?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=600&q=80',
        ];

        return [
            'filename'  => fake()->word() . '.jpg',
            'path'      => fake()->randomElement($unsplashUrls),
            'mime_type' => 'image/jpeg',
            'size'      => fake()->numberBetween(10240, 524288),
        ];
    }
}
