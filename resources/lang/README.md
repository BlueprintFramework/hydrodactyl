# Backend translations (`resources/lang`)

Laravel translation files for the Hydrodactyl panel.

## Golden rules

1. **`en-US` is canonical.** Today's exact English copy is preserved byte-for-byte. Backend tests
   (PHPUnit `assertJsonPath('errors.0.detail', ...)`, `expectExceptionMessage(...)`) and frontend
   specs depend on it; changing English copy is a breaking change unless every assertion is updated
   in the same commit.
2. **Use `__()` in all new code.** Existing `trans()` calls are functionally identical and remain
   until the unification task; do not mix new `trans()` into new code.
3. **One owner per key.** API error text, validation, activity entries, emails, and CLI messages
   live in the PHP files. UI-chrome strings live in `ui.json` inside the same locale folder. A few
   short labels appear on both sides with independent keys; that is expected.
4. **One folder per language, auto-discovered.** Everything for a locale lives in
   `resources/lang/<code>/` — the PHP dictionaries and the frontend `ui.json`. The backend scans
   the folders for display names with the `intl` extension (ISO 639-1 fallback) and feeds `User`
   validation and the admin selectors; the frontend receives the language list from the panel and
   fetches each dictionary through `/locales/<code>/ui.json`, so no frontend rebuild is needed.
   `tests/Unit/I18n/LocaleSyncTest.php` guards that every folder ships a valid `ui.json`.

## File layout

| File | Owns |
|---|---|
| `exceptions.php` | exception classes, `Handler` fallbacks, client/remote API errors |
| `validation.php` | validator messages + `attributes.*` display names |
| `strings.php` | small generic messages (`Handler`, misc services) |
| `auth.php`, `passwords.php` | authentication + password reset |
| `activity.php` | activity-log descriptions (rendered via `ActivityLogTransformer`) |
| `admin/`, `dashboard/`, `server/`, `command/` | panel-area and CLI messages |
| `ui.json` | panel UI dictionary consumed by the React frontend; not read by Laravel |

Add new keys to the file that owns the concern; never create a catch-all `misc.php`.

Strings rendered by Laravel itself (the mail template greeting, salutation, footer and the
"trouble clicking" subcopy) are translated with a JSON file next to the folders,
`resources/lang/<code>.json`, using Laravel's JSON translation format.

## Interpolation

Laravel-native `:placeholder` syntax:

```php
__('exceptions.backups.locked', ['name' => $backup->name]);
```

The legacy `GET /locales/locale.json` endpoint converts `:foo` to `{{foo}}` for consumers.

## Locale content rules (es)

- Castilian Spanish from Spain following RAE orthography (<https://www.rae.es/ortografia/>).
- Use "contraseña" (password), "servidor" (server), "copia de seguridad" (backup),
  "tarea programada" (schedule), "huevo" (egg) and "nido" (nest).
- Keep `:placeholders`, product names, egg/nest proper names, and technical identifiers untranslated.
- Do not use em dashes (—) as clause separators; prefer a colon, a comma or parentheses.
- Preserve the terminating punctuation style of each English source string.

## Verification

```
php vendor/bin/phpunit
php vendor/bin/phpstan analyse
php vendor/bin/php-cs-fixer fix --dry-run --diff
```
