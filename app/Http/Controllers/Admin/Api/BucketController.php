<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Aws\S3\S3Client;
use Aws\Exception\AwsException;
use Illuminate\Http\Request;
use Pterodactyl\Models\S3;
use Pterodactyl\Models\Backup;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Pterodactyl\Models\Server;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\S3\S3UpdateService;
use Pterodactyl\Services\S3\S3CreationService;
use Pterodactyl\Services\S3\S3DeletionService;
use Pterodactyl\Http\Requests\Admin\S3FormRequest;
use Pterodactyl\Http\Requests\Admin\NewS3FormRequest;

class BucketController extends Controller
{
    /**
     * BucketController constructor.
     */
    public function __construct(
        private S3CreationService $creationService,
        private S3UpdateService $updateService,
        private S3DeletionService $deletionService,
    ) {
    }

    /**
     * Return a paginated listing of S3 configurations.
     */
    public function index(Request $request): JsonResponse
    {
        $buckets = QueryBuilder::for(S3::query())
            ->select([
                's3.id',
                's3.name',
                's3.description',
                's3.endpoint',
                's3.region',
                's3.bucket_name',
                's3.use_path_style_endpoint',
                's3.enabled',
                's3.created_at',
                's3.updated_at',
            ])
            ->selectRaw('COUNT(servers.id) as server_count')
            ->leftJoin('servers', 'servers.bucket', '=', 's3.id')
            ->groupBy('s3.id')
            ->allowedFilters(['name', 'endpoint', 'bucket_name', 'enabled'])
            ->allowedSorts(['id', 'name', 'created_at'])
            ->paginate(min((int) $request->query('per_page', 50), 100));

        return response()->json([
            'data' => collect($buckets->items())
                ->map(fn (S3 $bucket) => $this->transform($bucket))
                ->values(),
            'meta' => [
                'pagination' => [
                    'total' => $buckets->total(),
                    'count' => $buckets->count(),
                    'per_page' => $buckets->perPage(),
                    'current_page' => $buckets->currentPage(),
                    'total_pages' => $buckets->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * Return a single S3 configuration.
     */
    public function view(S3 $s3): JsonResponse
    {
        $s3->loadCount('servers');

        $storageUsed = Cache::remember("s3_storage_{$s3->id}", 60, function () use ($s3) {
            return Backup::query()
                ->whereHas('server', fn ($query) => $query->where('bucket', $s3->id))
                ->where('is_successful', true)
                ->sum('bytes');
        });

        return response()->json([
            'data' => array_merge($this->transform($s3), [
                'access_key' => $s3->getAttribute('access_key'),
                'secret_key' => $s3->getAttribute('secret_key'),
                'servers_count' => (int) $s3->servers_count,
                'storage_used' => (int) $storageUsed,
                'created_at' => $s3->created_at?->toIso8601String(),
                'updated_at' => $s3->updated_at?->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Return the servers attached to an S3 configuration.
     */
    public function servers(S3 $s3): JsonResponse
    {
        $s3->load('servers.user', 'servers.nest', 'servers.egg');

        return response()->json([
            'data' => $s3->servers
                ->map(fn (Server $server) => [
                    'id' => $server->id,
                    'uuid_short' => $server->uuidShort,
                    'name' => $server->name,
                    'owner' => $server->user ? ['id' => $server->user->id, 'username' => $server->user->username] : null,
                    'nest' => $server->nest?->name,
                    'egg' => $server->egg?->name,
                ])
                ->values(),
        ]);
    }

    /**
     * Create a new S3 configuration.
     */
    public function store(NewS3FormRequest $request): JsonResponse
    {
        $s3 = $this->creationService->handle($request->validated());

        return response()->json(['data' => ['id' => $s3->id]], JsonResponse::HTTP_CREATED);
    }

    /**
     * Update an existing S3 configuration.
     */
    public function update(S3FormRequest $request, S3 $s3): JsonResponse
    {
        $this->updateService->handle($s3, $request->validated());

        return response()->json(['data' => ['id' => $s3->id]]);
    }

    /**
     * Delete an S3 configuration.
     */
    public function destroy(S3 $s3): JsonResponse
    {
        if ($s3->servers()->exists()) {
            throw new DisplayException('Cannot delete: bucket is used by servers.');
        }

        $this->deletionService->handle($s3->id);

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Attempt to connect to the provided S3 credentials and upload a test object.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $request->validate([
            'access_key' => 'required|string',
            'secret_key' => 'required|string',
            'bucket_name' => 'required|string',
            'endpoint' => 'nullable|string',
            'region' => 'nullable|string|max:64',
            'use_path_style_endpoint' => 'nullable|boolean',
        ]);

        try {
            $config = [
                'version' => 'latest',
                'region' => trim((string) $request->input('region', '')) ?: 'us-east-1',
                'credentials' => [
                    'key' => $request->input('access_key'),
                    'secret' => $request->input('secret_key'),
                ],
                'use_path_style_endpoint' => (bool) $request->input('use_path_style_endpoint', false),
            ];

            if ($endpoint = $request->input('endpoint')) {
                $config['endpoint'] = $endpoint;
            }

            $client = new S3Client($config);

            $bucket = $request->input('bucket_name');
            $key = '_hydrodactyl_test_' . time();
            $message = 'This is an upload test, If your reading this, it succeeded, happy Servering';
            $content = str_repeat($message . "\n", (int) (10 * 1024 * 1024 / (strlen($message) + 1)));

            $client->putObject([
                'Bucket' => $bucket,
                'Key' => $key,
                'Body' => $content,
                'ContentType' => 'text/plain',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Connection successful! A 10MB test file was uploaded as "' . $key . '".',
            ]);
        } catch (AwsException $exception) {
            return response()->json([
                'success' => false,
                'message' => 'S3 error: ' . ($exception->getAwsErrorMessage() ?: $exception->getMessage()),
            ], 400);
        } catch (\Exception $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $exception->getMessage(),
            ], 400);
        }
    }

    /**
     * Map an S3 model into the shape consumed by the interface.
     */
    private function transform(S3 $bucket): array
    {
        return [
            'id' => $bucket->id,
            'name' => $bucket->name,
            'description' => $bucket->description,
            'endpoint' => $bucket->endpoint,
            'region' => $bucket->region,
            'bucket_name' => $bucket->bucket_name,
            'use_path_style_endpoint' => (bool) $bucket->use_path_style_endpoint,
            'enabled' => (bool) $bucket->enabled,
            'server_count' => (int) ($bucket->server_count ?? 0),
        ];
    }
}
