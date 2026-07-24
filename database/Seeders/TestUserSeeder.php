<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Ramsey\Uuid\Uuid;
use Pterodactyl\Models\User;
use Illuminate\Database\Seeder;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        // uuid is a required column but not mass-assignable on User, so unguard
        // while seeding these fixture accounts.
        \Illuminate\Database\Eloquent\Model::unguard();

        // Delete all existing users (dev/test mode only)
        User::query()->forceDelete();

        User::create([
            'uuid' => Uuid::uuid4()->toString(),
            'username' => 'admin',
            'email' => 'admin@hydrodactyl.dev',
            'name_first' => 'Admin',
            'name_last' => 'User',
            'password' => bcrypt('admin'),
            'language' => 'en',
            'root_admin' => true,
            'use_totp' => false,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        User::create([
            'uuid' => Uuid::uuid4()->toString(),
            'username' => 'dev',
            'email' => 'dev@hydrodactyl.dev',
            'name_first' => 'Dev',
            'name_last' => 'User',
            'password' => bcrypt('dev'),
            'language' => 'en',
            'root_admin' => true,
            'use_totp' => false,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        User::create([
            'uuid' => Uuid::uuid4()->toString(),
            'username' => 'test',
            'email' => 'test@hydrodactyl.dev',
            'name_first' => 'Test',
            'name_last' => 'User',
            'password' => bcrypt('test'),
            'language' => 'en',
            'root_admin' => false,
            'use_totp' => false,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        \Illuminate\Database\Eloquent\Model::reguard();
    }
}
