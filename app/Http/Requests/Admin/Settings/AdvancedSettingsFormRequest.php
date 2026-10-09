<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class AdvancedSettingsFormRequest extends AdminFormRequest
{
  /**
   * Return all the rules to apply to this request's data.
   */
  public function rules(): array
  {
    return [
      'pterodactyl:guzzle:timeout' => 'required|integer|between:1,60',
      'pterodactyl:guzzle:connect_timeout' => 'required|integer|between:1,60',
      'pterodactyl:client_features:allocations:enabled' => 'required|in:true,false',
      'pterodactyl:client_features:allocations:range_start' => [
        'nullable',
        'required_if:pterodactyl:client_features:allocations:enabled,true',
        'integer',
        'between:1024,65535',
      ],
      'pterodactyl:client_features:allocations:range_end' => [
        'nullable',
        'required_if:pterodactyl:client_features:allocations:enabled,true',
        'integer',
        'between:1024,65535',
        'gt:pterodactyl:client_features:allocations:range_start',
      ],
      'pterodactyl:client_features:groups:enabled' => 'required|in:true,false',
      'pterodactyl:client_features:schedules:per_schedule_task_limit' => 'required|integer|between:1,100',
      'pterodactyl:client_features:schedules:stuck_timeout' => 'required|integer|between:901,86400',
    ];
  }

  public function attributes(): array
  {
    return [
      'pterodactyl:guzzle:timeout' => 'HTTP Request Timeout',
      'pterodactyl:guzzle:connect_timeout' => 'HTTP Connection Timeout',
      'pterodactyl:client_features:allocations:enabled' => 'Auto Create Allocations Enabled',
      'pterodactyl:client_features:allocations:range_start' => 'Starting Port',
      'pterodactyl:client_features:allocations:range_end' => 'Ending Port',
      'pterodactyl:client_features:groups:enabled' => 'Server Groups Enabled',
      'pterodactyl:client_features:schedules:per_schedule_task_limit' => 'Tasks Per Schedule Limit',
      'pterodactyl:client_features:schedules:stuck_timeout' => 'Stuck Schedule Timeout',
    ];
  }
}
