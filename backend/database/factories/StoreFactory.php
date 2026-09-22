<?php

namespace Database\Factories;

use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Store>
 */
class StoreFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Store::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $luxuryNames = [
            'JewelFlow Luxury Atelier & ERP',
            'JewelFlow Riverside Boutique',
            'JewelFlow Diamond & Gemstones Vault',
            'JewelFlow BKK1 Flagship Studio',
            'JewelFlow Royal Gold Gallery',
            'JewelFlow Central Plaza Branch',
            'JewelFlow Heritage Fine Jewelry',
        ];

        return [
            'name' => fake()->randomElement($luxuryNames) . ' (#' . fake()->numberBetween(1, 99) . ')',
            'code' => 'JF-' . fake()->unique()->numberBetween(100, 999),
            'phone' => '+855 (0) ' . fake()->numerify('## ### ###'),
            'email' => fake()->unique()->safeEmail(),
            'address' => '#' . fake()->buildingNumber() . ' ' . fake()->streetName() . ', Sangkat Chey Chumneas, Phnom Penh, Cambodia',
            'vat_tin' => 'K' . fake()->numerify('###-#########'),
            'logo' => null,
            'icon_image' => null,
            'invoice_disclaimer' => 'Purchased fine jewelry and precious bullion may be exchanged within 7 days with official sales invoice.',
            'is_primary' => false,
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the store is the primary atelier.
     */
    public function primary(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'JewelFlow Luxury Atelier & ERP',
            'code' => 'HQ-01',
            'is_primary' => true,
            'is_active' => true,
        ]);
    }

    /**
     * Indicate that the store is inactive / closed.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
