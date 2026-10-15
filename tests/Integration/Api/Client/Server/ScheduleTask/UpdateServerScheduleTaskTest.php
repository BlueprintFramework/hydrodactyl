<?php

namespace Pterodactyl\Tests\Integration\Api\Client\Server\ScheduleTask;

use Pterodactyl\Models\Task;
use Illuminate\Http\Response;
use Pterodactyl\Models\Schedule;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class UpdateServerScheduleTaskTest extends ClientApiIntegrationTestCase
{
    /**
     * Test that a task can be moved to an earlier position in the schedule without the
     * unique (schedule_id, sequence_id) index being violated while the tasks shift.
     */
    public function testTaskCanBeMovedToAnEarlierSequence()
    {
        [$user, $server] = $this->generateTestAccount();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create(['server_id' => $server->id]);

        $first = Task::factory()->create(['schedule_id' => $schedule->id, 'sequence_id' => 1]);
        $second = Task::factory()->create(['schedule_id' => $schedule->id, 'sequence_id' => 2]);
        $third = Task::factory()->create(['schedule_id' => $schedule->id, 'sequence_id' => 3]);

        $this->actingAs($user)
            ->postJson($this->link($third), [
                'action' => 'command',
                'payload' => 'say third',
                'time_offset' => 0,
                'sequence_id' => 1,
            ])
            ->assertOk();

        $this->assertSame(1, $third->refresh()->sequence_id);
        $this->assertSame(2, $first->refresh()->sequence_id);
        $this->assertSame(3, $second->refresh()->sequence_id);
    }

    /**
     * Test that a task can be moved to a later position in the schedule.
     */
    public function testTaskCanBeMovedToALaterSequence()
    {
        [$user, $server] = $this->generateTestAccount();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create(['server_id' => $server->id]);

        $first = Task::factory()->create(['schedule_id' => $schedule->id, 'sequence_id' => 1]);
        $second = Task::factory()->create(['schedule_id' => $schedule->id, 'sequence_id' => 2]);
        $third = Task::factory()->create(['schedule_id' => $schedule->id, 'sequence_id' => 3]);

        $this->actingAs($user)
            ->postJson($this->link($first), [
                'action' => 'command',
                'payload' => 'say first',
                'time_offset' => 0,
                'sequence_id' => 3,
            ])
            ->assertOk();

        $this->assertSame(3, $first->refresh()->sequence_id);
        $this->assertSame(1, $second->refresh()->sequence_id);
        $this->assertSame(2, $third->refresh()->sequence_id);
    }

    /**
     * Test that a task created at an earlier sequence pushes the existing tasks back
     * without the unique index being violated.
     */
    public function testTaskCanBeInsertedAtAnEarlierSequence()
    {
        [$user, $server] = $this->generateTestAccount();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create(['server_id' => $server->id]);

        $first = Task::factory()->create(['schedule_id' => $schedule->id, 'sequence_id' => 1]);
        $second = Task::factory()->create(['schedule_id' => $schedule->id, 'sequence_id' => 2]);

        $response = $this->actingAs($user)
            ->postJson($this->link($schedule, '/tasks'), [
                'action' => 'command',
                'payload' => 'say new',
                'time_offset' => 0,
                'sequence_id' => 1,
            ]);

        $response->assertOk();

        $created = Task::query()->findOrFail($response->json('attributes.id'));

        $this->assertSame(1, $created->sequence_id);
        $this->assertSame(2, $first->refresh()->sequence_id);
        $this->assertSame(3, $second->refresh()->sequence_id);
    }

    /**
     * Test that a task that is queued for execution cannot be deleted, which would leave
     * the queue worker referencing a task that no longer exists.
     */
    public function testQueuedTaskCannotBeDeleted()
    {
        [$user, $server] = $this->generateTestAccount();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create(['server_id' => $server->id]);
        $task = Task::factory()->create(['schedule_id' => $schedule->id, 'is_queued' => true]);

        $this->actingAs($user)
            ->deleteJson($this->link($task))
            ->assertStatus(Response::HTTP_FORBIDDEN);

        $this->assertDatabaseHas('tasks', ['id' => $task->id]);
    }

    /**
     * Test that a task that is currently processing cannot be deleted.
     */
    public function testProcessingTaskCannotBeDeleted()
    {
        [$user, $server] = $this->generateTestAccount();

        /** @var Schedule $schedule */
        $schedule = Schedule::factory()->create(['server_id' => $server->id]);
        $task = Task::factory()->create(['schedule_id' => $schedule->id, 'is_processing' => true]);

        $this->actingAs($user)
            ->deleteJson($this->link($task))
            ->assertStatus(Response::HTTP_FORBIDDEN);

        $this->assertDatabaseHas('tasks', ['id' => $task->id]);
    }
}
