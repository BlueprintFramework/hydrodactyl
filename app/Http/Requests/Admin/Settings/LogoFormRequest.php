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
            'app:name' => 'nullable|string|max:191',
        ];
    }

    public function attributes(): array
    {
        return [
            'logo_file' => 'Logo File',
            'logo_url' => 'Logo URL',
            'app:name' => 'Company Name',
        ];
    }

    public function messages(): array
    {
        return [
            'logo_file.mimes' => 'The logo must be a PNG, JPG, GIF, WEBP, or SVG file.',
            'logo_file.max' => 'The logo must not exceed 2MB in size.',
            'logo_url.url' => 'The logo URL must be a valid URL.',
        ];
    }
}
