<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

/**
 * An AT Protocol OAuth session, authorized against a single PDS account.
 *
 * The panel uses one of these to write DNS zone records into the account's
 * repository on behalf of a configured domain.
 *
 * @property string $id
 * @property string $status
 * @property string|null $account_did
 * @property string|null $handle
 * @property string|null $pds_url
 * @property string|null $authorization_server
 * @property string|null $scope
 * @property string|null $access_token
 * @property string|null $refresh_token
 * @property \Carbon\Carbon|null $access_token_expires_at
 * @property string $dpop_private_key
 * @property string|null $dpop_nonce_pds
 * @property string|null $dpop_nonce_as
 * @property string|null $state
 * @property string|null $code_verifier
 * @property string|null $return_url
 * @property \Carbon\Carbon|null $authorized_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class AtprotoOauthSession extends Model
{
    use HasUuids;

    public const STATUS_PENDING = 'pending';
    public const STATUS_AUTHORIZED = 'authorized';

    protected $table = 'atproto_oauth_sessions';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'status',
        'account_did',
        'handle',
        'pds_url',
        'authorization_server',
        'scope',
        'access_token',
        'refresh_token',
        'access_token_expires_at',
        'dpop_private_key',
        'dpop_nonce_pds',
        'dpop_nonce_as',
        'state',
        'code_verifier',
        'return_url',
        'authorized_at',
    ];

    protected $casts = [
        // Secrets at rest are encrypted with the application key.
        'access_token' => 'encrypted',
        'refresh_token' => 'encrypted',
        'dpop_private_key' => 'encrypted',
        'access_token_expires_at' => 'datetime',
        'authorized_at' => 'datetime',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
        'dpop_private_key',
    ];

    /**
     * Whether the session has completed authorization and holds usable tokens.
     */
    public function isAuthorized(): bool
    {
        return $this->status === self::STATUS_AUTHORIZED
            && !empty($this->refresh_token);
    }

    /**
     * Whether the stored access token has expired (or is about to within a
     * small safety margin).
     */
    public function accessTokenExpired(int $leewaySeconds = 30): bool
    {
        if (empty($this->access_token) || !$this->access_token_expires_at) {
            return true;
        }

        return $this->access_token_expires_at->subSeconds($leewaySeconds)->isPast();
    }

    /**
     * A label for the connected account.
     */
    public function accountLabel(): string
    {
        return $this->handle ?: (string) $this->account_did;
    }
}
