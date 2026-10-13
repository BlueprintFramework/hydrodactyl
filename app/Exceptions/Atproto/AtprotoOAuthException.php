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
        return new self(__('exceptions.atproto.discovery_failed', ['reason' => $reason]));
    }

    public static function authorizationFailed(string $reason): self
    {
        return new self(__('exceptions.atproto.authorization_failed', ['reason' => $reason]));
    }

    public static function requestFailed(string $reason): self
    {
        return new self(__('exceptions.atproto.request_failed', ['reason' => $reason]));
    }

    public static function misconfigured(string $reason): self
    {
        return new self(__('exceptions.atproto.misconfigured', ['reason' => $reason]));
    }
}
