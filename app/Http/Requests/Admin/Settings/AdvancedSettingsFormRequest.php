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
    ];
  }

  public function attributes(): array
  {
    return [
      'pterodactyl:guzzle:timeout' => __('validation.attributes.pterodactyl:guzzle:timeout'),
      'pterodactyl:guzzle:connect_timeout' => __('validation.attributes.pterodactyl:guzzle:connect_timeout'),
      'pterodactyl:client_features:allocations:enabled' => __('validation.attributes.pterodactyl:client_features:allocations:enabled'),
      'pterodactyl:client_features:allocations:range_start' => __('validation.attributes.pterodactyl:client_features:allocations:range_start'),
      'pterodactyl:client_features:allocations:range_end' => __('validation.attributes.pterodactyl:client_features:allocations:range_end'),
      'pterodactyl:client_features:groups:enabled' => __('validation.attributes.pterodactyl:client_features:groups:enabled'),
    ];
  }
}
