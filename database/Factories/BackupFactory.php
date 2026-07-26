<?php

namespace Database\Factories;

use Ramsey\Uuid\Uuid;
use Carbon\CarbonImmutable;
use Pterodactyl\Models\Backup;
use Pterodactyl\Enums\BackupAdapter;
use Illuminate\Database\Eloquent\Factories\Factory;

class BackupFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Backup::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'uuid' => Uuid::uuid7()->toString(),
            'name' => $this->faker->sentence,
            'disk' => BackupAdapter::Wings->value,
            'is_successful' => true,
            'ignored_files' => [],
            'created_at' => CarbonImmutable::now(),
            'completed_at' => CarbonImmutable::now(),
        ];
    }
}
