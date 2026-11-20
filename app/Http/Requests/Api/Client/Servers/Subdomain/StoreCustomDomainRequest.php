<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Subdomain;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class StoreCustomDomainRequest extends ClientApiRequest
{
    /**
     * Returns the rules for this request.
     */
    public function rules(): array
    {
        return [
            'hostname' => [
                'required',
                'string',
                'max:191',
                'regex:/^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)+$/',
                'unique:server_custom_domains,hostname',
            ],
            'api_token' => 'required|string|min:1|max:191',
            'allocation_id' => 'sometimes|nullable|integer',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'hostname.regex' => 'Enter a full domain name, such as play.example.com.',
            'hostname.unique' => 'This domain is already pointed at a server.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'hostname' => 'domain',
            'api_token' => 'API token',
            'allocation_id' => 'port',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Normalize domain name to lowercase
        if ($this->has('hostname')) {
            $this->merge([
                'hostname' => rtrim(strtolower(trim((string) $this->input('hostname'))), '.'),
            ]);
        }
    }
}
