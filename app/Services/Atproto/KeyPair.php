<?php

namespace Pterodactyl\Services\Atproto;

use phpseclib3\Crypt\EC;
use Lcobucci\JWT\Signer\Ecdsa\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;

/**
 * An ES256 (NIST P-256) key pair, used both for DPoP proofs and for confidential
 * client authentication (private_key_jwt).
 *
 * Private keys are PEM encoded and, in the database, stored through Laravel's
 * encrypted cast. Public keys are exposed as JWKs.
 */
class KeyPair
{
    public function __construct(
        private readonly string $privatePem,
        private readonly array $publicJwk,
    ) {
    }

    /**
     * Generate a fresh P-256 key pair.
     */
    public static function generate(): self
    {
        $key = EC::createKey('secp256r1');

        return self::fromPrivatePem($key->toString('PKCS8'));
    }

    /**
     * Rebuild a key pair from its PEM encoded private key.
     */
    public static function fromPrivatePem(string $privatePem): self
    {
        $decoded = json_decode(EC::loadPrivateKey($privatePem)->getPublicKey()->toString('JWK'), true);
        $jwk = $decoded['keys'][0] ?? $decoded;

        return new self($privatePem, $jwk);
    }

    public function privatePem(): string
    {
        return $this->privatePem;
    }

    /**
     * The bare public JWK (without alg/kid), suitable for use in a DPoP proof.
     */
    public function publicJwk(): array
    {
        return $this->publicJwk;
    }

    /**
     * The public JWK decorated with the metadata used in client JWKS documents.
     */
    public function publicJwkWithMetadata(): array
    {
        return $this->publicJwk + [
            'alg' => 'ES256',
            'use' => 'sig',
            'kid' => $this->thumbprint(),
        ];
    }

    /**
     * RFC 7638 JWK thumbprint (base64url encoded SHA-256 of the canonical JWK).
     */
    public function thumbprint(): string
    {
        $canonical = json_encode([
            'crv' => $this->publicJwk['crv'],
            'kty' => $this->publicJwk['kty'],
            'x' => $this->publicJwk['x'],
            'y' => $this->publicJwk['y'],
        ], JSON_UNESCAPED_SLASHES);

        return self::base64Url(hash('sha256', $canonical, true));
    }

    /**
     * Build a DPoP proof JWT (RFC 9449) for a specific request.
     *
     * @param string $method HTTP method of the request being made
     * @param string $url target URL without query string or fragment
     * @param string|null $nonce server issued nonce, when one is known
     * @param string|null $accessToken access token being presented, for the `ath` claim
     */
    public function dpopProof(string $method, string $url, ?string $nonce = null, ?string $accessToken = null): string
    {
        $claims = [
            'jti' => self::nonce(),
            'htm' => strtoupper($method),
            'htu' => $url,
            'iat' => time(),
        ];

        if ($nonce !== null && $nonce !== '') {
            $claims['nonce'] = $nonce;
        }

        if ($accessToken !== null && $accessToken !== '') {
            $claims['ath'] = self::base64Url(hash('sha256', $accessToken, true));
        }

        return $this->encode([
            'typ' => 'dpop+jwt',
            'alg' => 'ES256',
            'jwk' => $this->publicJwk,
        ], $claims);
    }

    /**
     * Build a confidential client assertion JWT (RFC 7523) for PAR and token
     * requests.
     *
     * @param string $clientId the client_id (also the JWT issuer and subject)
     * @param string $audience the Authorization Server issuer
     */
    public function clientAssertion(string $clientId, string $audience): string
    {
        $now = time();

        return $this->encode([
            'alg' => 'ES256',
            'kid' => $this->thumbprint(),
        ], [
            'iss' => $clientId,
            'sub' => $clientId,
            'aud' => $audience,
            'jti' => self::nonce(),
            'iat' => $now,
            'exp' => $now + 60,
        ]);
    }

    /**
     * Encode and sign a compact JWS with our ES256 key.
     *
     * The JWT is assembled by hand rather than through the token builder so the
     * claims stay exactly as required: `aud` must be a bare string and `iat` an
     * integer NumericDate, both of which the generic builder cannot guarantee.
     */
    private function encode(array $header, array $claims): string
    {
        $signingInput = self::base64Url((string) json_encode($header, JSON_UNESCAPED_SLASHES))
            . '.' . self::base64Url((string) json_encode($claims, JSON_UNESCAPED_SLASHES));

        $signature = (new Sha256())->sign($signingInput, InMemory::plainText($this->privatePem));

        return $signingInput . '.' . self::base64Url($signature);
    }

    /**
     * A fresh, URL-safe random identifier.
     */
    public static function nonce(): string
    {
        return self::base64Url(random_bytes(16));
    }

    /**
     * PKCE S256 verifier/challenge pair.
     *
     * @return array{verifier: string, challenge: string}
     */
    public static function pkce(): array
    {
        $verifier = self::base64Url(random_bytes(32));

        return [
            'verifier' => $verifier,
            'challenge' => self::base64Url(hash('sha256', $verifier, true)),
        ];
    }

    public static function base64Url(string $binary): string
    {
        return rtrim(strtr(base64_encode($binary), '+/', '-_'), '=');
    }
}
