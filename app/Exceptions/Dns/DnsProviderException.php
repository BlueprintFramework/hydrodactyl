<?php

namespace Pterodactyl\Exceptions\Dns;

use Exception;

class DnsProviderException extends Exception
{
    /**
     * Create a new DNS provider exception.
     */
    public function __construct(string $message = '', int $code = 0, ?Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Create an exception for connection failures.
     */
    public static function connectionFailed(string $provider, string $reason = ''): self
    {
        $key = $reason ? 'exceptions.dns.connection_failed_reason' : 'exceptions.dns.connection_failed';

        return new self(__($key, ['provider' => $provider, 'reason' => $reason]));
    }

    /**
     * Create an exception for authentication failures.
     */
    public static function authenticationFailed(string $provider): self
    {
        return new self(__('exceptions.dns.authentication_failed', ['provider' => $provider]));
    }

    /**
     * Create an exception for invalid configuration.
     */
    public static function invalidConfiguration(string $provider, string $field): self
    {
        return new self(__('exceptions.dns.invalid_configuration', ['provider' => $provider, 'field' => $field]));
    }

    /**
     * Create an exception for record creation failures.
     */
    public static function recordCreationFailed(string $domain, string $subdomain, string $reason = ''): self
    {
        $key = $reason ? 'exceptions.dns.record_creation_failed_reason' : 'exceptions.dns.record_creation_failed';

        return new self(__($key, ['domain' => $domain, 'subdomain' => $subdomain, 'reason' => $reason]));
    }

    /**
     * Create an exception for record update failures.
     */
    public static function recordUpdateFailed(string $domain, array $recordIds, string $reason = ''): self
    {
        $key = $reason ? 'exceptions.dns.record_update_failed_reason' : 'exceptions.dns.record_update_failed';

        return new self(__($key, ['domain' => $domain, 'records' => implode(', ', $recordIds), 'reason' => $reason]));
    }

    /**
     * Create an exception for record deletion failures.
     */
    public static function recordDeletionFailed(string $domain, array $recordIds, string $reason = ''): self
    {
        $key = $reason ? 'exceptions.dns.record_deletion_failed_reason' : 'exceptions.dns.record_deletion_failed';

        return new self(__($key, ['domain' => $domain, 'records' => implode(', ', $recordIds), 'reason' => $reason]));
    }

    /**
     * Create an exception for unsupported record types.
     */
    public static function unsupportedRecordType(string $provider, string $recordType): self
    {
        return new self(__('exceptions.dns.unsupported_record_type', ['provider' => $provider, 'record_type' => $recordType]));
    }
}