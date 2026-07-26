<?php

namespace Pterodactyl\Http\Controllers\Api\Remote;

use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;

class RusticConfigController extends Controller
{
    /**
     * Get rustic backup config.
     */
    public function show(Request $request, string $uuid): JsonResponse
    {
        $server = Server::where('uuid', $uuid)->firstOrFail();

        $type = $request->query('type', 'local');

        if (!in_array($type, ['local', 's3'])) {
            return response()->json(['error' => 'Invalid backup type'], 400);
        }

        $config = [
            'backup_type' => $type,
            'repository_password' => $this->getRepositoryPassword($server),
            'repository_path' => $this->getRepositoryPath($server, $type),
        ];

        if ($type === 's3') {
            $s3Credentials = $this->getS3Credentials($server);
            if (!$s3Credentials) {
                return response()->json(['error' => 'S3 credentials not configured for this server'], 400);
            }
            $config['s3_credentials'] = $s3Credentials;
        }

        return response()->json($config);
    }

    /**
     * Generate server-specific repository password.
     * This password is derived from the server UUID and application key for consistency.
     */
    private function getRepositoryPassword(Server $server): string
    {
        // Use a deterministic approach: hash server UUID with app key
        // This ensures the same password is generated each time for the same server
        return hash('sha256', $server->uuid . config('app.key'));
    }

    /**
     * Get server-specific repository path.
     */
    private function getRepositoryPath(Server $server, string $type): string
    {
        if ($type === 'local') {
            $basePath = config('backups.disks.rustic_local.repository_base_path', '/var/lib/pterodactyl/rustic-repos');

            return rtrim($basePath, '/') . '/' . $server->uuid;
        }

        // For S3, use the server's node bucket to build the S3 path
        $s3Bucket = $server->node->s3Bucket;
        if (!$s3Bucket) {
            throw new \InvalidArgumentException('S3 bucket not configured for this server\'s node');
        }

        $config = $s3Bucket->toRusticS3Config();
        $prefix = rtrim($config['prefix'] ?? 'rustic-repos/', '/');

        return sprintf('%s/%s/%s', $config['bucket'], $prefix, $server->uuid);
    }

    /**
     * Get S3 credentials for rustic S3 backups from the server's node bucket.
     */
    private function getS3Credentials(Server $server): ?array
    {
        $s3Bucket = $server->node->s3Bucket;
        if (!$s3Bucket) {
            return null;
        }

        $config = $s3Bucket->toRusticS3Config();

        return [
            'access_key_id' => $config['key'] ?? '',
            'secret_access_key' => $config['secret'] ?? '',
            'session_token' => '', // Not typically used for rustic
            'region' => $config['region'] ?? 'us-east-1',
            'bucket' => $config['bucket'],
            'endpoint' => $config['endpoint'] ?? '',
            'force_path_style' => $config['force_path_style'] ?? false,
            'disable_ssl' => $config['disable_ssl'] ?? false,
            'ca_cert_path' => $config['ca_cert_path'] ?? '',
        ];
    }
}
