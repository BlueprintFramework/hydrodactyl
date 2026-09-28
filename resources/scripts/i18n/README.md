# Frontend i18n

Typed, dynamic translations for the Hydrodactyl React panel.

## Golden rules

1. **No hardcoded user-facing English in components.** Every label, heading, toast, modal, empty
   state, aria-label, and help text must come from `t()`.
2. **`en.json` is canonical.** It defines the `TranslationKey` type at compile time. Other locales
   are deep-partial and fall back to `en` per key.
3. **Never re-translate backend strings.** API error details already arrive localized
   (`errors.0.detail` -> `httpErrorToHuman()`); render them as-is.
4. **English copy changes are forbidden** unless the same task updates every spec/assertion that
   depends on it. PHPUnit and vitest both assert on existing English copy.
5. **No new npm dependencies.** The system is hand-rolled on React Context.

## Key ownership

| Namespace | Owner | Where |
|---|---|---|
| `common.*` | Frontend | `i18n/locales/en.json` |
| `navigation.*` | Frontend | `i18n/locales/en.json` |
| `panel.*` | Frontend | `i18n/locales/en.json` |
| `server.<module>.*` | Frontend | `i18n/locales/en.json` |
| `account.*` | Frontend | `i18n/locales/en.json` |
| `errors.*` (UI-level only) | Frontend | `i18n/locales/en.json` |
| `validation.*`, `exceptions.*`, `activity.*`, `auth.*`, `strings.*`, `command/*`, `dashboard/*`, `server/*`, `admin/*` | Backend | `resources/lang/<locale>/*.php` |

If a string is rendered from data the backend produced (activity log entries, validation errors,
exception details), it is backend-owned. Do not add a frontend key for it.

## Naming convention

- Lowercase `snake_case` segments; dots mirror the nested JSON path:
  `server.backups.delete_confirm`, `panel.navigation.files`, `errors.not_found.title`.
- Labels are nouns (`backups.title`), actions are verbs (`common.delete`), outcome messages are
  verb + state (`files.copy_success`), paired copy uses `_title` / `_description`.
- Interpolation params are `{{snake_case}}` and must be declared in the same task that adds the key:
  `"files.saved": "Saved {{name}}!"`.

## Usage

```tsx
import { useTranslation } from '@/i18n/I18nProvider';

const { t } = useTranslation();

return <h2>{t('server.backups.title')}</h2>;
```

`t()` is strictly typed: `t('server.backups.titl')` is a compile error.

## Locale resolution

`localStorage` override -> `user.language` -> site locale -> browser languages -> `en-US`.

- `setLocale(code)` persists the override, updates `document.documentElement.lang`, and lazily
  imports the locale chunk.
- Only `en-US` is bundled up front; every other dictionary is code-split on demand.
- The default locale is treated as "no opinion" so a fresh visitor gets whichever shipped
  language their browser asks for, with no setup on their side.
- date-fns and cronstrue locales are resolved through `i18n/loader.ts`.

## Adding a locale (no code changes)

1. Copy `i18n/locales/en-US.json` to `i18n/locales/<code>.json` (e.g. `fr-FR`) and translate the values.
2. Copy `resources/lang/en-US/` to `resources/lang/<code>/` and translate the PHP files.
3. Done. Both dictionaries are auto-discovered: the language shows up in the account selector,
   the first-run setup wizard and the admin default-language dropdown with no further wiring.
4. Dates are best-effort through the `date-fns` map in `i18n/loader.ts`; cron descriptions
   localize automatically from the language part of the code.

Codes are validated against the discovered files, so any `xx` or `xx-YY` folder works.

## Locale content rules (es)

- Castilian Spanish from Spain, following RAE orthography (<https://www.rae.es/ortografia/>).
- Address the user impersonally or with `tú`; do not use `vosotros` outside explanatory prose.
- Use Spanish technical vocabulary: "contraseña" (password), "servidor" (server),
  "copia de seguridad" (backup), "programador" is deprecated - prefer "tarea programada" (schedule).
- Keep placeholders and product names (`Hydrodactyl`, egg names, file names) untranslated.

## Verification

```
pnpm check
pnpm typecheck
pnpm exec vitest run
pnpm build
```
