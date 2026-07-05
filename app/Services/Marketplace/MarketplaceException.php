<?php

namespace Pterodactyl\Services\Marketplace;

use RuntimeException;

/**
 * Thrown by marketplace adapters when an upstream provider fails or returns a
 * response we cannot understand. The controller converts this into a 502 JSON
 * response so the frontend can show a per-source error toast.
 */
class MarketplaceException extends RuntimeException
{
    public static function upstream(string $source, string $message, ?\Throwable $previous = null): self
    {
        return new self(sprintf('[%s] %s', $source, $message), 0, $previous);
    }
}
