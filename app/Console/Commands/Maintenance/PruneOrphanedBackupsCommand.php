<?php

namespace Pterodactyl\Console\Commands\Maintenance;

use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Pterodactyl\Models\Backup;

class PruneOrphanedBackupsCommand extends Command
{
    protected $signature = 'p:maintenance:prune-backups {--prune-age=}';

    protected $description = 'Marks all backups older than "n" minutes that have not yet completed as being failed.';

    /**
     * PruneOrphanedBackupsCommand constructor.
     */
    public function __construct()
    {
        parent::__construct();
    }

    public function handle()
    {
        $since = $this->option('prune-age') ?? config('backups.prune_age', 360);
        if (!$since || !is_digit($since)) {
            throw new \InvalidArgumentException(__('command/messages.maintenance.prune_age_invalid'));
        }

        $query = Backup::query()
            ->whereNull('completed_at')
            ->where('created_at', '<=', CarbonImmutable::now()->subMinutes($since)->toDateTimeString());

        $count = $query->count();
        if (!$count) {
            $this->info(__('command/messages.maintenance.no_orphaned_backups_to_fail'));

            return;
        }

        $this->warn(__('command/messages.maintenance.marking_orphaned_backups', ['count' => $count, 'minutes' => $since]));

        $query->update([
            'is_successful' => false,
            'completed_at' => CarbonImmutable::now(),
            'updated_at' => CarbonImmutable::now(),
        ]);
    }
}
