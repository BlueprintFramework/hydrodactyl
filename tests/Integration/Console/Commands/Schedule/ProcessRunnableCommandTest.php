<?php

namespace Pterodactyl\Tests\Integration\Console\Commands\Schedule;

use Pterodactyl\Models\Task;
use Pterodactyl\Models\Schedule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Bus;
use Pterodactyl\Jobs\Schedule\RunTaskJob;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class ProcessRunnableCommandTest extends ClientApiIntegrationTestCase
{
    /**
     * Test that a schedule which has never had its next run date calculated is still
     * picked up rather than being skipped forever.
     */
    public function testScheduleWithNullNextRunAtIsProcessed()
    {
        Bus::fake();

        $server = $this->createServerModel();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create([
            'server_id' => $server->id,
            'is_active' => true,
            'is_processing' => false,
            'next_run_at' => null,
        ]);

        /** @var Task $task */
        $task = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => 1,
            'time_offset' => 0,
        ]);

        $this->artisan('p:schedule:process')->assertSuccessful();

        $this->assertDatabaseHas('schedules', ['id' => $schedule->id, 'is_processing' => true]);
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'is_queued' => true]);

        Bus::assertDispatched(RunTaskJob::class);
    }

    /**
     * Test that a schedule which is legitimately waiting on a delayed task is not reset
     * as stuck just because a delay can be longer than the old fixed timeout.
     */
    public function testScheduleWaitingOnDelayedTaskIsNotResetAsStuck()
    {
        Bus::fake();

        $server = $this->createServerModel();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create([
            'server_id' => $server->id,
            'is_active' => true,
            'is_processing' => true,
            'next_run_at' => now()->addDay(),
        ]);

        /** @var Task $task */
        $task = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => 1,
            'is_queued' => true,
        ]);

        // The schedule was last touched 700 seconds ago, which is longer than the old 600
        // second timeout but shorter than the 900 second maximum task delay.
        DB::table('schedules')->where('id', $schedule->id)->update(['updated_at' => now()->subSeconds(700)]);

        $this->artisan('p:schedule:process')->assertSuccessful();

        $this->assertDatabaseHas('schedules', ['id' => $schedule->id, 'is_processing' => true]);
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'is_queued' => true]);

        Bus::assertNotDispatched(RunTaskJob::class);
    }

    /**
     * Test that a schedule which really is stuck is still reset.
     */
    public function testStuckScheduleIsReset()
    {
        Bus::fake();

        $server = $this->createServerModel();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create([
            'server_id' => $server->id,
            'is_active' => true,
            'is_processing' => true,
            'next_run_at' => now()->addDay(),
        ]);

        /** @var Task $task */
        $task = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'sequence_id' => 1,
            'is_queued' => true,
        ]);

        DB::table('schedules')->where('id', $schedule->id)->update(['updated_at' => now()->subSeconds(2000)]);

        $this->artisan('p:schedule:process')->assertSuccessful();

        $this->assertDatabaseHas('schedules', ['id' => $schedule->id, 'is_processing' => false]);
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'is_queued' => false]);

        Bus::assertNotDispatched(RunTaskJob::class);
    }
}
