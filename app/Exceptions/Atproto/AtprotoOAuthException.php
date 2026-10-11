<?php

namespace Pterodactyl\Exceptions\Atproto;

/**
 * Raised when an AT Protocol OAuth operation fails: identity discovery, the
 * authorization request, a token exchange, or an authorized repository call.
 */
class AtprotoOAuthException extends \Exception
{
    public static function discoveryFailed(string $reason): self
    {
        return new self("Could not resolve the AT Protocol identity: {$reason}");
    }

    public static function authorizationFailed(string $reason): self
    {
        return new self("AT Protocol authorization failed: {$reason}");
    }

    public static function requestFailed(string $reason): self
    {
        return new self("AT Protocol request failed: {$reason}");
    }

    public static function misconfigured(string $reason): self
    {
        return new self("AT Protocol OAuth is not configured correctly: {$reason}");
    }
}
