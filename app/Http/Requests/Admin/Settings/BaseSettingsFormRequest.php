<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Illuminate\Validation\Rule;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class BaseSettingsFormRequest extends AdminFormRequest
{
    use AvailableLanguages;

    public function rules(): array
    {
        return [
            'app:name' => 'required|string|max:191',
            'pterodactyl:auth:2fa_required' => 'required|integer|in:0,1,2',
            'app:locale' => ['required', 'string', Rule::in(array_keys($this->getAvailableLanguages()))],
        ];
    }

    public function normalize(?array $only = null): array
    {
        $values = parent::normalize([
            'app:name',
            'pterodactyl:auth:2fa_required',
            'app:locale',
        ]);

        return $values;
    }

    public function attributes(): array
    {
        return [
            'app:name' => __('validation.attributes.app:name'),
            'pterodactyl:auth:2fa_required' => __('validation.attributes.pterodactyl:auth:2fa_required'),
            'app:locale' => __('validation.attributes.app:locale'),
        ];
    }
}
