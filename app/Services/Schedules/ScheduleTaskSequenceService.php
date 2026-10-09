<?php

namespace Pterodactyl\Services\Schedules;

use Pterodactyl\Models\Task;
use Pterodactyl\Models\Schedule;

class ScheduleTaskSequenceService
{
    /**
     * Move a task to the given sequence position, shifting the tasks between its old and
     * new positions as needed.
     *
     * The task is first parked on a sequence id above every other task so that the tasks it
     * is moving past have an empty slot to slide into. Without this, shifting a task
     * downwards would collide with the task being moved, and shifting one upwards would
     * collide with the slot it just left.
     */
    public function move(Schedule $schedule, Task $task, int $newSequence): void
    {
        if ($newSequence === $task->sequence_id) {
            return;
        }

        $originalSequence = $task->sequence_id;

        // Park the task above every sequence currently in use (and above the requested
        // position) so the unique index cannot be violated while the other tasks slide.
        // A negative value can't be used here because sequence ids are validated to be
        // at least 1 when the task is saved.
        $maxSequence = (int) $schedule->tasks()->max('sequence_id');
        $task->update(['sequence_id' => max($originalSequence, $newSequence, $maxSequence) + 1]);

        if ($newSequence < $originalSequence) {
            $this->shift($schedule, $newSequence, $originalSequence - 1, 1);
        } else {
            $this->shift($schedule, $originalSequence + 1, $newSequence, -1);
        }

        $task->update(['sequence_id' => $newSequence]);
    }

    /**
     * Shift the "sequence_id" of every task within the given inclusive range by the
     * provided delta (-1 or 1).
     *
     * A unique index exists on (schedule_id, sequence_id), so shifting a whole range
     * with a single UPDATE can transiently collide with a neighboring row and throw a
     * duplicate key error (the order rows are visited in is not guaranteed). Instead,
     * the rows are moved one at a time from the edge of the range inwards: the highest
     * sequence is moved first when incrementing and the lowest is moved first when
     * decrementing, so the destination slot is always empty when it is written to.
     */
    public function shift(Schedule $schedule, int $start, int $end, int $delta): void
    {
        if ($delta === 0 || $start > $end) {
            return;
        }

        $tasks = Task::query()
            ->where('schedule_id', $schedule->id)
            ->whereBetween('sequence_id', [$start, $end])
            ->orderBy('sequence_id', $delta > 0 ? 'desc' : 'asc')
            ->get();

        foreach ($tasks as $task) {
            $task->update(['sequence_id' => $task->sequence_id + $delta]);
        }
    }
}
