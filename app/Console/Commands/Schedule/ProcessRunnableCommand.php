<?php

namespace Pterodactyl\Console\Commands\Schedule;

use Exception;
use Illuminate\Console\Command;
use Pterodactyl\Models\Schedule;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Builder;
use Pterodactyl\Services\Schedules\ProcessScheduleService;

class ProcessRunnableCommand extends Command
{
    protected $signature = 'p:schedule:process';

    protected $description = 'Process schedules in the database and determine which are ready to run.';

    /**
     * Handle command execution.
     */
    public function handle(): int
    {
        $this->cleanupStuckSchedules();

        $schedules = Schedule::query()
            ->with('tasks')
            ->whereRelation('server', fn (Builder $builder) => $builder->whereNull('status'))
            ->where('is_active', true)
            ->where('is_processing', false)
            ->where(function (Builder $builder) {
                $builder->whereNull('next_run_at')->orWhere('next_run_at', '<=', now());
            })
            ->get();

        if ($schedules->count() < 1) {
            $this->line('There are no scheduled tasks for servers that need to be run.');

            return 0;
        }

        $bar = $this->output->createProgressBar(count($schedules));
        foreach ($schedules as $schedule) {
            $bar->clear();
            $this->processSchedule($schedule);
            $bar->advance();
            $bar->display();
        }

        $this->line('');

        return 0;
    }

    /**
     * Processes a given schedule and logs and errors encountered the console output. This should
     * never throw an exception out, otherwise you'll end up killing the entire run group causing
     * any other schedules to not process correctly.
     *
     * @see https://github.com/pterodactyl/panel/issues/2609
     */
    protected function processSchedule(Schedule $schedule)
    {
        if ($schedule->tasks->isEmpty()) {
            return;
        }

        try {
            $this->getLaravel()->make(ProcessScheduleService::class)->handle($schedule);

            $this->line(trans('command/messages.schedule.output_line', [
                'schedule' => $schedule->name,
                'hash' => $schedule->hashid,
            ]));
        } catch (\Throwable $exception) {
            Log::error($exception, ['schedule_id' => $schedule->id]);

            $this->error("An error was encountered while processing Schedule #$schedule->id: " . $exception->getMessage());
        }
    }

    protected function cleanupStuckSchedules(): void
    {
        // This should stop schedules from being wrongfully stopped due to max in-panel timeout
        // being 600
        $timeout = (int) config('pterodactyl.client_features.schedules.stuck_timeout', 1800);

        $stuck = Schedule::query()
            ->where('is_processing', true)
            ->where('updated_at', '<', now()->subSeconds($timeout))
            ->get();

        if ($stuck->count() > 0) {
            $this->warn("Found {$stuck->count()} stuck schedule(s), resetting...");

            foreach ($stuck as $schedule) {
                $schedule->update(['is_processing' => false]);
                $schedule->tasks()->update([
                    'is_queued' => false,
                    'is_processing' => false,
                ]);

                Log::warning('Reset stuck schedule', [
                    'schedule_id' => $schedule->id,
                    'schedule_name' => $schedule->name,
                    'last_updated' => $schedule->updated_at,
                ]);
            }
        }
    }
}
