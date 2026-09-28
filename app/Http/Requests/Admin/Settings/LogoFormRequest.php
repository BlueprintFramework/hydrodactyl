<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class LogoFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'logo_file' => 'nullable|file|mimes:png,jpg,jpeg,gif,webp,svg|max:2048',
            'logo_url' => 'nullable|url|max:2048',
            'remove' => 'nullable|boolean',
            'rewind' => 'nullable|integer|min:0',
        ];
    }

    public function attributes(): array
    {
        return [
            'logo_file' => __('validation.attributes.logo_file'),
            'logo_url' => __('validation.attributes.logo_url'),
        ];
    }

    public function messages(): array
    {
        return [
            'logo_file.mimes' => __('validation.json_api.logo_mimes'),
            'logo_file.max' => __('validation.json_api.logo_max'),
            'logo_url.url' => __('validation.json_api.logo_url_invalid'),
        ];
    }
}
