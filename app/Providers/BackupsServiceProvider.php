<?php

namespace Pterodactyl\Providers;

use Illuminate\Support\ServiceProvider;
use Pterodactyl\Extensions\Backups\BackupManager;
use Pterodactyl\Models\S3;
use Pterodactyl\Services\Backups\BackupCoordinator;
use Pterodactyl\Services\Backups\BackupDriverManager;

class BackupsServiceProvider extends ServiceProvider
{
    /**
     * Register the S3 backup disk.
     */
    public function register(): void
    {
        $this->app->singleton(BackupManager::class, function ($app) {
            return new BackupManager($app);
        });

        $this->app->singleton(BackupDriverManager::class, function ($app) {
            return new BackupDriverManager($app);
        });

        $this->app->singleton(BackupCoordinator::class);
    }

    /**
     * Bootstrap services by populating backup disk config from the database.
     */
    public function boot(): void
    {
        try {
            $s3Bucket = S3::where('enabled', true)->first();
            if (!$s3Bucket) {
                return;
            }

            $s3Config = [
                'adapter' => 's3',
                'key' => $s3Bucket->access_key,
                'secret' => $s3Bucket->secret_key,
                'bucket' => $s3Bucket->bucket_name,
                'region' => $s3Bucket->region ?: 'us-east-1',
                'endpoint' => $s3Bucket->endpoint,
                'use_path_style_endpoint' => $s3Bucket->use_path_style_endpoint,
            ];

            config(['backups.disks.s3' => array_merge(
                config('backups.disks.s3', []),
                $s3Config
            )]);

            config(['backups.disks.rustic_s3' => array_merge(
                config('backups.disks.rustic_s3', []),
                [
                    'adapter' => 'rustic_s3',
                    'key' => $s3Bucket->access_key,
                    'secret' => $s3Bucket->secret_key,
                    'bucket' => $s3Bucket->bucket_name,
                    'region' => $s3Bucket->region ?: 'us-east-1',
                    'endpoint' => $s3Bucket->endpoint,
                    'force_path_style' => $s3Bucket->use_path_style_endpoint,
                    'prefix' => env('RUSTIC_S3_PREFIX', 'rustic-repos/'),
                ],
            )]);
        } catch (\Exception $e) {
            // Table may not exist yet (fresh install, migrations not run)
        }
    }
}
