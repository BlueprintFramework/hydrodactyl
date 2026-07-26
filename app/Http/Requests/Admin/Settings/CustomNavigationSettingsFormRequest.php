<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Closure;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class CustomNavigationSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'app:custom_nav_items' => 'array|max:3',
            'app:custom_nav_items.*.label' => 'nullable|string|max:32',
            'app:custom_nav_items.*.url' => [
                'nullable',
                'string',
                'max:2048',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (!is_string($value) || $value === '') {
                        return;
                    }

                    $scheme = parse_url($value, PHP_URL_SCHEME);

                    if (
                        str_starts_with($value, '/') ||
                        (in_array($scheme, ['http', 'https'], true) && filter_var($value, FILTER_VALIDATE_URL) !== false)
                    ) {
                        return;
                    }

                    $fail('The :attribute must be an HTTP(S) URL or internal path.');
                },
            ],
            'app:custom_nav_items.*.icon' => 'nullable|string|in:link,book,globe,help,home,store,discord,document,terminal,rocket',
        ];
    }

    public function normalize(?array $only = null): array
    {
        $items = collect($this->input('app:custom_nav_items', []))
            ->take(3)
            ->map(function (array $item): ?array {
                $label = trim((string) ($item['label'] ?? ''));
                $url = trim((string) ($item['url'] ?? ''));
                $icon = trim((string) ($item['icon'] ?? 'link'));

                if ($label === '' && $url === '') {
                    return null;
                }

                return [
                    'label' => $label,
                    'url' => $url,
                    'icon' => $icon !== '' ? $icon : 'link',
                ];
            })
            ->filter()
            ->values()
            ->toArray();

        return [
            'app:custom_nav_items' => json_encode($items),
        ];
    }

    public function attributes(): array
    {
        return [
            'app:custom_nav_items.*.label' => 'Custom Nav Item Label',
            'app:custom_nav_items.*.url' => 'Custom Nav Item Link',
            'app:custom_nav_items.*.icon' => 'Custom Nav Item Icon',
        ];
    }
}
