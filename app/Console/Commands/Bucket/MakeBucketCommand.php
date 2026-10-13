<?php

namespace Pterodactyl\Console\Commands\Bucket;

use Illuminate\Console\Command;
use Pterodactyl\Services\S3\S3CreationService;

class MakeBucketCommand extends Command
{
    protected $signature = 'p:bucket:make
                            {--name= : A display name for this S3 configuration.}
                            {--description= : A brief description of this S3 configuration.}
                            {--access-key= : The S3 access key.}
                            {--secret-key= : The S3 secret key.}
                            {--endpoint= : The S3 endpoint URL (leave blank for AWS S3).}
                            {--bucket-name= : The S3 bucket name.}
                            {--use-path-style-endpoint= : Use path-style endpoints? (1=yes / 0=no).}
                            {--enabled= : Whether this configuration is enabled (1=enabled / 0=disabled).}';

    protected $description = 'Creates a new S3 bucket configuration on the system via the CLI.';

    public function __construct(private S3CreationService $creationService)
    {
        parent::__construct();
    }

    public function handle()
    {
        $data['name'] = $this->option('name') ?? $this->ask(__('command/messages.bucket.ask_display_name'));
        $data['description'] = $this->option('description') ?? $this->ask(__('command/messages.bucket.ask_description'), '');
        $data['access_key'] = $this->option('access-key') ?? $this->ask(__('command/messages.bucket.ask_access_key'));
        $data['secret_key'] = $this->option('secret-key') ?? $this->ask(__('command/messages.bucket.ask_secret_key'));
        $data['endpoint'] = $this->option('endpoint') ?? $this->ask(__('command/messages.bucket.ask_endpoint'), '');
        $data['bucket_name'] = $this->option('bucket-name') ?? $this->ask(__('command/messages.bucket.ask_bucket_name'));
        $data['use_path_style_endpoint'] = $this->option('use-path-style-endpoint') ?? $this->confirm(__('command/messages.bucket.ask_path_style'), false);
        $data['enabled'] = $this->option('enabled') ?? $this->confirm(__('command/messages.bucket.ask_enabled'), true);

        $bucket = $this->creationService->handle($data);
        $this->line(__('command/messages.bucket.created', ['name' => $data['name'], 'id' => $bucket->id]));
    }
}
