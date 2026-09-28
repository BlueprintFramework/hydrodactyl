# Backend translations (`resources/lang`)

Laravel translation files for the Hydrodactyl panel.

## Golden rules

1. **`en` is canonical.** Today's exact English copy is preserved byte-for-byte. Backend tests
   (PHPUnit `assertJsonPath('errors.0.detail', ...)`, `expectExceptionMessage(...)`) and frontend
   specs depend on it; changing English copy is a breaking change unless every assertion is updated
   in the same commit.
2. **Use `__()` in all new code.** Existing `trans()` calls are functionally identical and remain
   until the unification task; do not mix new `trans()` into new code.
3. **One owner per key.** API error text, validation, activity entries, emails, and CLI messages
   live here. UI-chrome strings live in `resources/scripts/i18n/locales/*.json`.
4. **Adding a locale directory auto-registers it.** `AvailableLanguages` scans `resource_path('lang')`
   and derives display names via ISO 639-1 (`languageByCode1`). Locale codes must be exactly two
   lowercase letters (`es`, never `es-ES`); it also feeds `User` validation and the admin settings
   locale selector.

## File layout

| File | Owns |
|---|---|
| `exceptions.php` | exception classes, `Handler` fallbacks, client/remote API errors |
| `validation.php` | validator messages + `attributes.*` display names |
| `strings.php` | small generic messages (`Handler`, misc services) |
| `auth.php`, `passwords.php` | authentication + password reset |
| `activity.php` | activity-log descriptions (rendered via `ActivityLogTransformer`) |
| `admin/`, `dashboard/`, `server/`, `command/` | panel-area and CLI messages |

Add new keys to the file that owns the concern; never create a catch-all `misc.php`.

## Interpolation

Laravel-native `:placeholder` syntax:

```php
__('exceptions.backups.locked', ['name' => $backup->name]);
```

The legacy `GET /locales/locale.json` endpoint converts `:foo` to `{{foo}}` for consumers.

## Locale content rules (es)

- Castilian Spanish from Spain following RAE orthography (<https://www.rae.es/ortografia/>).
- Use "contraseña" (password), "servidor" (server), "copia de seguridad" (backup),
  "tarea programada" (schedule).
- Keep `:placeholders`, product names, egg names, and technical identifiers untranslated.
- Preserve the terminating punctuation style of each English source string.

## Verification

```
php vendor/bin/phpunit
php vendor/bin/phpstan analyse
php vendor/bin/php-cs-fixer fix --dry-run --diff
```
