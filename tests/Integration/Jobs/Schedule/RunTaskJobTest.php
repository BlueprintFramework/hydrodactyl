<?php

namespace Pterodactyl\Tests\Integration\Jobs\Schedule;

use Carbon\Carbon;
use Carbon\CarbonImmutable;
use GuzzleHttp\Psr7\Request;
use Pterodactyl\Models\Task;
use GuzzleHttp\Psr7\Response;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Schedule;
use Illuminate\Support\Facades\Bus;
use Pterodactyl\Jobs\Schedule\RunTaskJob;
use GuzzleHttp\Exception\BadResponseException;
use Pterodactyl\Services\Elytra\ElytraJobService;
use Pterodactyl\Tests\Integration\IntegrationTestCase;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;
use Pterodactyl\Services\Backups\Wings\InitiateBackupService;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class RunTaskJobTest extends IntegrationTestCase
{
    /**
     * An inactive job should not be run by the system.
     */
    public function testInactiveJobIsNotRun()
    {
        $server = $this->createServerModel();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create([
            'server_id' => $server->id,
            'is_processing' => true,
            'last_run_at' => null,
            'is_active' => false,
        ]);
        /** @var Task $task */
        $task = Task::factory()->create(['schedule_id' => $schedule->id, 'is_queued' => true]);

        $job = new RunTaskJob($task);

        Bus::dispatchSync($job);

        $task->refresh();
        $schedule->refresh();

        $this->assertFalse($task->is_queued);
        $this->assertFalse($schedule->is_processing);
        $this->assertFalse($schedule->is_active);
        $this->assertTrue(CarbonImmutable::now()->isSameAs(\DateTimeInterface::ATOM, $schedule->last_run_at));
    }

    public function testJobWithInvalidActionThrowsException()
    {
        $server = $this->createServerModel();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create(['server_id' => $server->id]);
        /** @var Task $task */
        $task = Task::factory()->create(['schedule_id' => $schedule->id, 'action' => 'foobar']);

        $job = new RunTaskJob($task);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid task action provided: foobar');
        Bus::dispatchSync($job);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('isManualRunDataProvider')]
    public function testJobIsExecuted(bool $isManualRun)
    {
        $server = $this->createServerModel();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create([
            'server_id' => $server->id,
            'is_active' => !$isManualRun,
            'is_processing' => true,
            'last_run_at' => null,
        ]);
        /** @var Task $task */
        $task = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'action' => Task::ACTION_POWER,
            'payload' => 'start',
            'is_queued' => true,
            'continue_on_failure' => false,
        ]);

        $mock = \Mockery::mock(DaemonPowerRepository::class);
        $this->instance(DaemonPowerRepository::class, $mock);

        $mock->expects('setServer')->with(\Mockery::on(function ($value) use ($server) {
            return $value instanceof Server && $value->id === $server->id;
        }))->andReturnSelf();
        $mock->expects('send')->with('start')->andReturn(new Response());

        Bus::dispatchSync(new RunTaskJob($task, $isManualRun));

        $task->refresh();
        $schedule->refresh();

        $this->assertFalse($task->is_queued);
        $this->assertFalse($schedule->is_processing);
        $this->assertTrue(CarbonImmutable::now()->isSameAs(\DateTimeInterface::ATOM, $schedule->last_run_at));
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('isManualRunDataProvider')]
    public function testExceptionDuringRunIsHandledCorrectly(bool $continueOnFailure)
    {
        $server = $this->createServerModel();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create(['server_id' => $server->id]);
        /** @var Task $task */
        $task = Task::factory()->create([
            'schedule_id' => $schedule->id,
            'action' => Task::ACTION_POWER,
            'payload' => 'start',
            'continue_on_failure' => $continueOnFailure,
        ]);

        $mock = \Mockery::mock(DaemonPowerRepository::class);
        $this->instance(DaemonPowerRepository::class, $mock);

        $mock->expects('setServer->send')->andThrow(
            new DaemonConnectionException(new BadResponseException('Bad request', new Request('GET', '/test'), new Response()))
        );

        if (!$continueOnFailure) {
            $this->expectException(DaemonConnectionException::class);
        }

        Bus::dispatchSync(new RunTaskJob($task));

        if ($continueOnFailure) {
            $task->refresh();
            $schedule->refresh();

            $this->assertFalse($task->is_queued);
            $this->assertFalse($schedule->is_processing);
            $this->assertTrue(CarbonImmutable::now()->isSameAs(\DateTimeInterface::ATOM, $schedule->last_run_at));
        }
    }

    /**
     * Test that a schedule is not executed if the server is suspended.
     *
     * @see https://github.com/pterodactyl/panel/issues/4008
     */
    public function testTaskIsNotRunIfServerIsSuspended()
    {
        $server = $this->createServerModel([
            'status' => Server::STATUS_SUSPENDED,
        ]);

        $schedule = Schedule::factory()->for($server)->create([
            'last_run_at' => Carbon::now()->subHour(),
        ]);

        $task = Task::factory()->for($schedule)->create([
            'action' => Task::ACTION_POWER,
            'payload' => 'start',
        ]);

        Bus::dispatchSync(new RunTaskJob($task));

        $task->refresh();
        $schedule->refresh();

        $this->assertFalse($task->is_queued);
        $this->assertFalse($schedule->is_processing);
        $this->assertTrue(Carbon::now()->isSameAs(\DateTimeInterface::ATOM, $schedule->last_run_at));
    }

    public function testScheduledBackupUsesWingsBackupServiceForWingsNode(): void
    {
        $server = $this->createServerModel(['backup_limit' => 5]);
        $server->node->update(['daemonType' => 'wings']);

        $schedule = Schedule::factory()->for($server)->create(['is_processing' => true]);
        $task = Task::factory()->for($schedule)->create([
            'action' => Task::ACTION_BACKUP,
            'payload' => "cache\ntemp",
            'is_queued' => true,
        ]);

        $backupService = \Mockery::mock(InitiateBackupService::class);
        $this->instance(InitiateBackupService::class, $backupService);
        $backupService->expects('setIgnoredFiles')->with(['cache', 'temp'])->andReturnSelf();
        $backupService->expects('handle')
            ->with(\Mockery::on(fn (Server $value) => $value->is($server)), null, true)
            ->once();

        $elytraJobService = \Mockery::mock(ElytraJobService::class);
        $this->instance(ElytraJobService::class, $elytraJobService);
        $elytraJobService->shouldNotReceive('submitJob');

        Bus::dispatchSync(new RunTaskJob($task));

        $this->assertFalse($task->fresh()->is_queued);
        $this->assertFalse($task->fresh()->is_processing);
        $this->assertFalse($schedule->fresh()->is_processing);
    }

    public function testScheduledBackupUsesElytraJobServiceForElytraNode(): void
    {
        $server = $this->createServerModel(['backup_limit' => 5]);
        $server->node->update(['daemonType' => 'elytra']);

        $schedule = Schedule::factory()->for($server)->create(['is_processing' => true]);
        $task = Task::factory()->for($schedule)->create([
            'action' => Task::ACTION_BACKUP,
            'payload' => '',
            'is_queued' => true,
        ]);

        $backupService = \Mockery::mock(InitiateBackupService::class);
        $this->instance(InitiateBackupService::class, $backupService);
        $backupService->shouldNotReceive('setIgnoredFiles');

        $elytraJobService = \Mockery::mock(ElytraJobService::class);
        $this->instance(ElytraJobService::class, $elytraJobService);
        $elytraJobService->expects('submitJob')
            ->with(
                \Mockery::on(fn (Server $value) => $value->is($server)),
                'backup_create',
                \Mockery::on(fn (array $data) => $data['operation'] === 'create'
                    && $data['ignored'] === ''
                    && $data['is_automatic'] === true),
                \Mockery::on(fn ($user) => $user->is($server->user))
            )
            ->once()
            ->andReturn([]);

        Bus::dispatchSync(new RunTaskJob($task));

        $this->assertFalse($task->fresh()->is_queued);
        $this->assertFalse($task->fresh()->is_processing);
        $this->assertFalse($schedule->fresh()->is_processing);
    }

    public static function isManualRunDataProvider(): array
    {
        return [[true], [false]];
    }
}
