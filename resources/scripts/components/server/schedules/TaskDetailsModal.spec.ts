import type { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import { completeTaskSubmission } from '@/components/server/schedules/TaskDetailsModal';

const task = (id: number): Task => ({
    id,
    sequenceId: id,
    action: 'command',
    payload: 'say hello',
    timeOffset: 0,
    isQueued: false,
    continueOnFailure: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
});

const schedule = (tasks: Task[]): Schedule => ({
    id: 1,
    name: 'Test schedule',
    cron: { dayOfWeek: '*', month: '*', dayOfMonth: '*', hour: '*', minute: '*' },
    isActive: true,
    isProcessing: false,
    onlyWhenOnline: false,
    lastRunAt: null,
    nextRunAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    tasks,
});

describe('completeTaskSubmission', () => {
    it('stops submitting before dismissing the modal after creating a task', () => {
        const events: string[] = [];
        const existingTask = task(1);
        const savedTask = task(2);
        let updatedSchedule: Schedule | undefined;

        completeTaskSubmission(
            schedule([existingTask]),
            savedTask,
            (submitting) => events.push(`submitting:${submitting}`),
            (value) => {
                events.push('schedule:updated');
                updatedSchedule = value;
            },
            () => events.push('modal:dismissed'),
        );

        expect(events).toEqual(['submitting:false', 'schedule:updated', 'modal:dismissed']);
        expect(updatedSchedule?.tasks).toEqual([existingTask, savedTask]);
    });
});
