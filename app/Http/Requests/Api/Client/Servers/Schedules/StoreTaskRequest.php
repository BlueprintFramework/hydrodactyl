<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Schedules;

use Pterodactyl\Models\Task;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Permission;

class StoreTaskRequest extends ViewScheduleRequest
{
    /**
     * Creating or editing a task requires schedule.update.
     */
    public function permission(): string
    {
        return Permission::ACTION_SCHEDULE_UPDATE;
    }

    /**
     * On top of schedule.update, the user must hold the permission for the action the task
     * performs (e.g. control.console for a command task). Otherwise a schedule would let
     * them do something they cannot do directly.
     */
    public function authorize(): bool
    {
        if (!parent::authorize()) {
            return false;
        }

        $permission = Task::permissionForAction((string) $this->input('action'), $this->input('payload'));
        if (is_null($permission)) {
            return true;
        }

        $server = $this->route()->parameter('server');

        return $server instanceof Server && $this->user()->can($permission, $server);
    }

    public function rules(): array
    {
        return [
            'action' => 'required|in:command,power,backup',
            'payload' => [
                'required_unless:action,backup',
                'string',
                'nullable',
                function ($attribute, $value, $fail) {
                    if ($this->input('action') === 'power' && !in_array($value, ['start', 'stop', 'restart', 'kill'])) {
                        $fail(__('validation.json_api.power_action_invalid'));
                    }
                },
            ],
            'time_offset' => 'required|numeric|min:0|max:900',
            'sequence_id' => 'sometimes|required|numeric|min:1',
            'continue_on_failure' => 'sometimes|required|boolean',
        ];
    }
}
