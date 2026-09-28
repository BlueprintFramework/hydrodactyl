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

`localStorage` override -> `user.language` -> `settings.locale` -> `en`.

- `setLocale(code)` persists the override, updates `document.documentElement.lang`, and lazily
  imports the locale chunk.
- Non-`en` locales are code-split; `en` is always bundled so first paint never blocks.
- date-fns and cronstrue locales are resolved through `i18n/loader.ts`.

## Adding a locale

1. Add `i18n/locales/<code>.json` (two-letter ISO 639-1 only).
2. Register it in the static maps in `i18n/loader.ts`: `loaders`, `dateFnsLocales`,
   `cronstrueLocales`, and `locales`.
3. Add the matching `resources/lang/<code>/` backend mirror.
4. Never use template-literal `import()` — Vite requires static specifiers.

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
