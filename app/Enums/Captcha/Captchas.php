<?php

namespace Pterodactyl\Enums\Captcha;

enum Captchas: string
{
    case NONE = 'none';
    case TURNSTILE = 'turnstile';
    case HCAPTCHA = 'hcaptcha';
    case RECAPTCHA = 'recaptcha';
    case CAP = 'cap';

    /**
     * Return the providers keyed by value with their translated labels.
     */
    public static function all(): array
    {
        $result = [];
        foreach (self::cases() as $case) {
            $result[$case->value] = __("admin/settings.captcha.providers.{$case->value}");
        }

        return $result;
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
