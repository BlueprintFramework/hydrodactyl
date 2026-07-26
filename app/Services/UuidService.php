<?php

namespace Pterodactyl\Services;

use Ramsey\Uuid\Uuid;
use Illuminate\Support\Str;

class UuidService
{
    /**
     * Generate a new UUIDv7 string.
     */
    public function uuid(): string
    {
        return Uuid::uuid7()->toString();
    }

    /**
     * Generate a random 8-character hex string suitable for use as a
     * short server identifier (uuidShort).
     */
    public function uuidShort(): string
    {
        return Str::lower(Str::random(8));
    }
}
