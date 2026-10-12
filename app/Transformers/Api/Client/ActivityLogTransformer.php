<?php

namespace Pterodactyl\Transformers\Api\Client;

use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Pterodactyl\Models\User;
use Pterodactyl\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;

class ActivityLogTransformer extends BaseClientTransformer
{
    protected array $availableIncludes = ['actor'];

    public function getResourceName(): string
    {
        return ActivityLog::RESOURCE_NAME;
    }

    public function transform(ActivityLog $model): array
    {
        return [
            // This is not for security, it is only to provide a unique identifier to
            // the front-end for each entry to improve rendering performance since there
            // is nothing else sufficiently unique to key off at this point.
            'id' => sha1($model->id),
            'batch' => $model->batch,
            'event' => $model->event,
            'is_api' => !is_null($model->api_key_id),
            'ip' => $this->canViewIP($model->actor) ? $model->ip : null,
            'description' => $this->getDescription($model),
            'description_parts' => $this->getDescriptionParts($model),
            'properties' => $this->properties($model),
            'has_additional_metadata' => $this->hasAdditionalMetadata($model),
            'timestamp' => $model->timestamp->toAtomString(),
        ];
    }

    public function includeActor(ActivityLog $model)
    {
        if (!$model->actor instanceof User) {
            return $this->null();
        }

        return $this->item($model->actor, $this->makeTransformer(UserTransformer::class), User::RESOURCE_NAME);
    }

    /**
     * Resolve the human readable description for an activity event. Custom
     * descriptions stored on the model win; otherwise the event string is
     * translated on the fly so it always matches the language of the viewer.
     */
    protected function getDescription(ActivityLog $model): ?string
    {
        if (!is_null($model->description)) {
            return $model->description;
        }

        $key = 'activity.' . str_replace(':', '.', $model->event);

        if (!app('translator')->has($key)) {
            return null;
        }

        return __($key, $this->translationReplacements($model));
    }

    /**
     * Split the translated description into structured parts so the front-end
     * can render substituted values (commands, paths, names, ...) with
     * emphasis instead of a single wall of text.
     */
    protected function getDescriptionParts(ActivityLog $model): ?array
    {
        if (!is_null($model->description)) {
            return null;
        }

        $key = 'activity.' . str_replace(':', '.', $model->event);

        if (!app('translator')->has($key)) {
            return null;
        }

        $template = trans($key);
        $replace = $this->translationReplacements($model);

        if (empty($replace) || !preg_match_all('/:([\w.]+)/', $template, $matches, PREG_OFFSET_CAPTURE)) {
            return [['type' => 'text', 'content' => $template]];
        }

        $parts = [];
        $offset = 0;

        foreach ($matches[0] as $index => [$token, $position]) {
            $value = $replace[$matches[1][$index][0]] ?? null;

            if ($value === null) {
                continue;
            }

            $text = substr($template, $offset, $position - $offset);
            if ($text !== '') {
                $parts[] = ['type' => 'text', 'content' => $text];
            }

            $parts[] = ['type' => 'value', 'content' => $value];
            $offset = $position + strlen($token);
        }

        $tail = substr($template, $offset);
        if ($tail !== '') {
            $parts[] = ['type' => 'text', 'content' => $tail];
        }

        return $parts;
    }

    /**
     * Build the replacement map used to translate an activity event. Scalar
     * properties are exposed as-is, array properties are flattened using dot
     * notation and, when there is only one, its size is exposed as ":count".
     */
    protected function translationReplacements(ActivityLog $model): array
    {
        $replace = [];
        $arrayCounts = [];

        foreach ($model->properties ?? [] as $property => $value) {
            if (is_array($value)) {
                $arrayCounts[$property] = count($value);

                foreach (Arr::dot([$property => $value]) as $dotKey => $dotValue) {
                    if (is_scalar($dotValue)) {
                        $replace[$dotKey] = (string) $dotValue;
                    }
                }
            } elseif (is_scalar($value)) {
                $replace[$property] = (string) $value;
            }
        }

        // Mirror the property normalization used for the API output so a single
        // array property exposes its size as ":count" in the translation.
        if (count($arrayCounts) === 1) {
            $replace['count'] = (string) reset($arrayCounts);
        }

        return $replace;
    }

    /**
     * Transforms any array values in the properties into a countable field for easier
     * use within the translation outputs.
     */
    protected function properties(ActivityLog $model): object
    {
        if (!$model->properties || $model->properties->isEmpty()) {
            return (object) [];
        }

        $properties = $model->properties
            ->mapWithKeys(function ($value, $key) use ($model) {
                if ($key === 'ip' && !optional($model->actor)->is($this->request->user())) {
                    return [$key => '[hidden]'];
                }

                if (!is_array($value)) {
                    // Perform some directory normalization at this point.
                    if ($key === 'directory') {
                        $value = str_replace('//', '/', '/' . trim($value, '/') . '/');
                    }

                    return [$key => $value];
                }

                return [$key => $value, "{$key}_count" => count($value)];
            });

        $keys = $properties->keys()->filter(fn ($key) => Str::endsWith($key, '_count'))->values();
        if ($keys->containsOneItem()) {
            $properties = $properties->merge(['count' => $properties->get($keys[0])])->except($keys[0]);
        }

        return (object) $properties->toArray();
    }

    /**
     * Determines if there are any log properties that we've not already exposed
     * in the response language string and that are not just the IP address or
     * the browser useragent.
     *
     * This is used by the front-end to selectively display an "additional metadata"
     * button that is pointless if there is nothing the user can't already see from
     * the event description.
     */
    protected function hasAdditionalMetadata(ActivityLog $model): bool
    {
        if (is_null($model->properties) || $model->properties->isEmpty()) {
            return false;
        }

        $str = __('activity.' . str_replace(':', '.', $model->event));
        preg_match_all('/:(?<key>[\w.-]+\w)(?:[^\w:]?|$)/', $str, $matches);

        $exclude = array_merge($matches['key'], ['ip', 'useragent', 'using_sftp']);
        foreach ($model->properties->keys() as $key) {
            if (!in_array($key, $exclude, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determines if the user can view the IP address in the output either because they are the
     * actor that performed the action, or because they are an administrator on the Panel.
     */
    protected function canViewIP(?Model $actor = null): bool
    {
        return optional($actor)->is($this->request->user()) || $this->request->user()->root_admin;
    }
}
