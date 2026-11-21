<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class PasskeySettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'passkeys:enabled' => 'required|boolean',
            'passkeys:relying_party_id' => [
                'required',
                'string',
                'max:253',
                'regex:/^[A-Za-z0-9.-]+$/',
            ],
            'passkeys:allowed_origins' => [
                'required',
                'string',
                'max:2048',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (!is_string($value)) {
                        $fail(__('validation.string', ['attribute' => $attribute]));

                        return;
                    }

                    $origins = array_values(array_filter(array_map('trim', explode(',', $value))));
                    $relyingPartyId = strtolower(trim((string) $this->input('passkeys:relying_party_id')));

                    if ($origins === []) {
                        $fail(__('validation.required', ['attribute' => $attribute]));

                        return;
                    }

                    foreach ($origins as $origin) {
                        $parts = parse_url($origin);

                        if (
                            !is_array($parts)
                            || !in_array(strtolower((string) ($parts['scheme'] ?? '')), ['http', 'https'], true)
                            || empty($parts['host'])
                            || isset($parts['user'])
                            || isset($parts['pass'])
                            || (isset($parts['path']) && $parts['path'] !== '' && $parts['path'] !== '/')
                            || isset($parts['query'])
                            || isset($parts['fragment'])
                        ) {
                            $fail(__('validation.json_api.passkey_origin_invalid'));

                            return;
                        }

                        $host = strtolower($parts['host']);
                        if ($host !== $relyingPartyId && !str_ends_with($host, '.' . $relyingPartyId)) {
                            $fail(__('validation.json_api.passkey_origin_not_in_relying_party'));
                        }
                    }
                },
            ],
        ];
    }

    public function normalize(?array $only = null): array
    {
        $origins = array_values(array_filter(array_map(
            function (string $origin): string {
                $origin = rtrim(trim($origin), '/');
                $parts = parse_url($origin);

                if (!is_array($parts) || empty($parts['host'])) {
                    return $origin;
                }

                $normalized = strtolower((string) ($parts['scheme'] ?? 'https')) . '://' . strtolower($parts['host']);
                if (isset($parts['port'])) {
                    $normalized .= ':' . $parts['port'];
                }

                return $normalized;
            },
            explode(',', (string) $this->input('passkeys:allowed_origins')),
        )));

        return [
            'passkeys:enabled' => $this->boolean('passkeys:enabled') ? 'true' : 'false',
            'passkeys:relying_party_id' => strtolower(trim((string) $this->input('passkeys:relying_party_id'))),
            'passkeys:allowed_origins' => implode(', ', $origins),
        ];
    }

    public function attributes(): array
    {
        return [
            'passkeys:enabled' => __('validation.attributes.passkeys:enabled'),
            'passkeys:relying_party_id' => __('validation.attributes.passkeys:relying_party_id'),
            'passkeys:allowed_origins' => __('validation.attributes.passkeys:allowed_origins'),
        ];
    }
}
