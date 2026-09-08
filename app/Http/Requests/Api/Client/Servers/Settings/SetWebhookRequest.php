<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Settings;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class SetWebhookRequest extends ClientApiRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'webhook_type' => [
                'nullable',
                'required_with:webhook_url',
                'string',
                'min:1',
                'max:64',
                function ($attribute, $value, $fail) {
                    if (!array_key_exists($value, config('webhook.allowed_webhook_types', []))) {
                        $fail("Webhook type not allowed");
                        return;
                    }
                }
            ],
            'webhook_url' => [
                'nullable',
                'required_with:webhook_type',
                'url',
                'min:1',
                'max:191',
                function ($attribute, $value, $fail) {
                    if (filter_var($value, FILTER_VALIDATE_URL)) {
                        $scheme = parse_url($value, PHP_URL_SCHEME);

                        if ($scheme !== 'http' && $scheme !== 'https') {
                            $fail("Invalid protocol");
                            return;
                        }
                    }
                },
            ],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    // protected function prepareForValidation(): void
    // {
    //     // Sanitize and normalize subdomain
    //     // if ($this->has('webhook_type')) {
    //     //     $webhook_type = $this->input('webhook_type');
    //     //     $this->merge([
    //     //         'webhook_type' => $webhook_type,
    //     //     ]);
    //     // }
    //     // if ($this->has('webhook_url')) {
    //     //     $webhook_url = $this->input('webhook_url');
    //     //     $this->merge([
    //     //         'webhook_url' => $webhook_url,
    //     //     ]);
    //     // }
    // }
}
