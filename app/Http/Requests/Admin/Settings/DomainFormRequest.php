<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class DomainFormRequest extends AdminFormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $domainId = $this->route('domain')?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:191',
                'regex:/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/',
                $domainId ? "unique:domains,name,{$domainId}" : 'unique:domains,name',
            ],
            'dns_provider' => 'required|string|in:cloudflare,hetzner,route53,bunny',
            'dns_config' => 'required|array',
            'dns_config.api_token' => 'required_if:dns_provider,cloudflare,hetzner|string|min:1',
            'dns_config.access_key_id' => 'required_if:dns_provider,route53|string|min:1',
            'dns_config.secret_access_key' => 'required_if:dns_provider,route53|string|min:1',
            'dns_config.region' => 'sometimes|string|min:1',
            'dns_config.hosted_zone_id' => 'sometimes|string|min:1',
            'dns_config.zone_id' => 'sometimes|string|min:1',
            'dns_config.api_key' => 'required_if:dns_provider,bunny|string|min:1',
            'is_active' => 'sometimes|boolean',
            'is_default' => 'sometimes|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => __('validation.json_api.domain_name_required'),
            'name.regex' => __('validation.json_api.domain_name_format'),
            'name.unique' => __('validation.json_api.domain_name_unique'),
            'dns_provider.required' => __('validation.json_api.dns_provider_required'),
            'dns_provider.in' => __('validation.json_api.dns_provider_invalid'),
            'dns_config.required' => __('validation.json_api.dns_config_required'),
            'dns_config.api_token.required_if' => __('validation.json_api.dns_api_token_required'),
            'dns_config.access_key_id.required_if' => __('validation.json_api.dns_access_key_id_required'),
            'dns_config.secret_access_key.required_if' => __('validation.json_api.dns_secret_access_key_required'),
            'dns_config.api_key.required_if' => __('validation.json_api.dns_api_key_required'),
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => __('validation.attributes.domain_name'),
            'dns_provider' => __('validation.attributes.dns_provider'),
            'dns_config.api_token' => __('validation.attributes.dns_config.api_token'),
            'dns_config.access_key_id' => __('validation.attributes.dns_config.access_key_id'),
            'dns_config.secret_access_key' => __('validation.attributes.dns_config.secret_access_key'),
            'dns_config.region' => __('validation.attributes.dns_config.region'),
            'dns_config.hosted_zone_id' => __('validation.attributes.dns_config.hosted_zone_id'),
            'dns_config.api_key' => __('validation.attributes.dns_config.api_key'),
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Normalize domain name to lowercase
        if ($this->has('name')) {
            $this->merge([
                'name' => strtolower(trim($this->input('name'))),
            ]);
        }

        // Ensure boolean fields are properly cast
        foreach (['is_active', 'is_default'] as $field) {
            if ($this->has($field)) {
                $this->merge([
                    $field => filter_var($this->input($field), FILTER_VALIDATE_BOOLEAN),
                ]);
            }
        }
    }
}
