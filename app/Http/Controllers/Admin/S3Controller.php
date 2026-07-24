<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\View\View;
use Illuminate\Http\Request;
use Pterodactyl\Models\S3;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Contracts\Translation\Translator;
use Pterodactyl\Services\S3\S3CreationService;
use Pterodactyl\Services\S3\S3DeletionService;
use Pterodactyl\Services\S3\S3UpdateService;
use Pterodactyl\Contracts\Repository\S3RepositoryInterface;
use Pterodactyl\Http\Requests\Admin\S3FormRequest;
use Pterodactyl\Http\Requests\Admin\NewS3FormRequest;
use Aws\S3\S3Client;
use Aws\Exception\AwsException;

class S3Controller extends Controller
{
    public function __construct(
        protected AlertsMessageBag $alert,
        protected S3CreationService $creationService,
        protected S3DeletionService $deletionService,
        protected Translator $translator,
        protected S3UpdateService $updateService,
        protected S3RepositoryInterface $repository,
        protected ViewFactory $view,
    ) {}

    public function index(Request $request): View
    {
        $buckets = QueryBuilder::for(S3::query())
            ->select([
                's3.id',
                's3.name',
                's3.description',
                's3.access_key',
                's3.secret_key',
                's3.endpoint',
                's3.bucket_name',
                's3.use_path_style_endpoint',
                's3.enabled',
                's3.is_local',
                's3.minio_instance_url',
                's3.created_at',
                's3.updated_at',
            ])
            ->selectRaw('COUNT(servers.id) as server_count')
            ->leftJoin('servers', 'servers.bucket', '=', 's3.id')
            ->groupBy('s3.id')
            ->allowedFilters(['name', 'endpoint', 'bucket_name', 'enabled'])
            ->allowedSorts(['id', 'name', 'created_at'])
            ->paginate(50);

        return $this->view->make('admin.s3.index', ['buckets' => $buckets]);
    }

    public function create(): View
    {
        return $this->view->make('admin.s3.new', [
            'minio_endpoint' => config('filesystems.disks.s3.endpoint', 'http://localhost:9000'),
            'minio_console_url' => env('MINIO_CONSOLE_URL', 'http://localhost:9001'),
        ]);
    }

    public function view(S3 $s3): View
    {
        $s3->load('servers');

        return $this->view->make('admin.s3.view', [
            'bucket' => $s3,
        ]);
    }

    public function delete(Request $request, S3 $s3): RedirectResponse
    {
        if ($s3->servers()->exists()) {
            $this->alert->error('Cannot delete: bucket is used by servers.')->flash();
            return redirect()->route('admin.depr.buckets.view', $s3->id);
        }

        $this->deletionService->handle($s3);
        $this->alert->success('S3 configuration deleted.')->flash();

        return redirect()->route('admin.depr.buckets');
    }

    public function store(NewS3FormRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if (!empty($data['is_local'])) {
            $data['is_local'] = true;
            $data['minio_instance_url'] = $data['minio_instance_url'] ?? config('filesystems.disks.s3.endpoint', 'http://localhost:9000');
            $data['use_path_style_endpoint'] = true;
        }

        $s3 = $this->creationService->handle($data);

        $this->alert->success('S3 configuration created.')->flash();

        return redirect()->route('admin.depr.buckets.view', $s3->id);
    }

    public function update(S3FormRequest $request, S3 $s3): RedirectResponse
    {
        $this->updateService->handle($s3, $request->validated());

        $this->alert->success('S3 configuration updated.')->flash();

        return redirect()->route('admin.depr.buckets.view', $s3->id);
    }

    public function provisionLocal(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'bucket_name' => 'required|string|max:255|unique:s3,bucket_name',
        ]);

        $accessKey = env('MINIO_ROOT_USER', 'minioadmin');
        $secretKey = env('MINIO_ROOT_PASSWORD', 'minioadmin');
        $endpoint = env('MINIO_ENDPOINT', 'http://minio:9000');
        $consoleUrl = env('MINIO_CONSOLE_URL', 'http://localhost:9001');
        $bucketName = $request->input('bucket_name');
        $region = 'us-east-1';

        try {
            $client = new S3Client([
                'version' => 'latest',
                'region' => $region,
                'endpoint' => $endpoint,
                'use_path_style_endpoint' => true,
                'credentials' => [
                    'key' => $accessKey,
                    'secret' => $secretKey,
                ],
            ]);

            if (!$client->doesBucketExist($bucketName)) {
                $client->createBucket(['Bucket' => $bucketName]);
            }

            $s3 = $this->creationService->handle([
                'name' => $request->input('name'),
                'description' => $request->input('description'),
                'access_key' => $accessKey,
                'secret_key' => $secretKey,
                'endpoint' => $endpoint,
                'bucket_name' => $bucketName,
                'use_path_style_endpoint' => true,
                'enabled' => true,
                'is_local' => true,
                'minio_instance_url' => $consoleUrl,
            ]);

            $this->alert->success("Local MinIO bucket '{$bucketName}' created and configured.")->flash();

            return redirect()->route('admin.depr.buckets.view', $s3->id);
        } catch (AwsException $e) {
            $error = $e->getAwsErrorMessage() ?: $e->getMessage();
            $this->alert->error("MinIO provisioning failed: {$error}")->flash();

            return redirect()->route('admin.depr.buckets.new');
        } catch (\Exception $e) {
            $this->alert->error("Failed to provision MinIO bucket: {$e->getMessage()}")->flash();

            return redirect()->route('admin.depr.buckets.new');
        }
    }

    public function testConnection(Request $request): \Illuminate\Http\JsonResponse
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
            ];

            if ($endpoint = $request->input('endpoint')) {
                $config['endpoint'] = $endpoint;
            }

            $config['use_path_style_endpoint'] = (bool) $request->input('use_path_style_endpoint', false);

            $client = new S3Client($config);

            $bucket = $request->input('bucket_name');
            $key = '_hydrodactyl_test_' . time();

            $message = "This is an upload test, If your reading this, it succeeded, happy Servering";
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
        } catch (AwsException $e) {
            $error = $e->getAwsErrorMessage() ?: $e->getMessage();
            return response()->json([
                'success' => false,
                'message' => 'S3 error: ' . $error,
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ], 400);
        }
    }
}
