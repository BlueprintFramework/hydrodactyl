<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'sequence_id' => $this->faker->unique()->numberBetween(1, 1000),
            'action' => 'command',
            'payload' => 'test command',
            'time_offset' => 120,
            'is_queued' => false,
        ];
    }
}
