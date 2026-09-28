# Frontend i18n

Typed, dynamic translations for the Hydrodactyl React panel.

## Single source of truth

Every language lives in exactly one place: `resources/lang/<code>/`.

- `*.php` — backend messages read by Laravel `__()`. See `resources/lang/README.md`.
- `ui.json` — the panel UI dictionary this module consumes.

`resources/lang/en-US` is canonical: its `ui.json` defines the `TranslationKey`
type at compile time. Other locales are deep-partial and fall back to English
per key. The `@lang` alias (tsconfig, vite and vitest) points at
`resources/lang`.

## Golden rules

1. **No hardcoded user-facing English in components.** Every label, heading, toast, modal, empty
   state, aria-label, and help text must come from `t()`.
2. **`en-US` is canonical.** Changing its keys or English copy is a breaking change for the type
   system and for tests that pin copy.
3. **Never re-translate backend strings.** API error details already arrive localized
   (`errors.0.detail` -> `httpErrorToHuman()`); render them as-is.
4. **No new npm dependencies.** The system is hand-rolled on React Context.
5. **Don't edit `ui.json` in a non-canonical locale for keys you don't understand** — partial
   dictionaries are fine, missing keys fall back to English.

## Key ownership

| Namespace | Owner | Where |
|---|---|---|
| `common.*`, `navigation.*`, `panel.*`, `errors.*` (UI), `setup.*`, `auth.*` (UI), `dashboard.*` (UI), `account.*`, `server.<module>.*`, `admin.*` (UI widget) | Frontend | `resources/lang/<locale>/ui.json` |
| `validation.*`, `exceptions.*`, `activity.*`, `strings.*`, `auth.*` (backend), `command/*`, `dashboard/*`, `server/*`, `admin/*` | Backend | `resources/lang/<locale>/*.php` |

A handful of short labels are legitimately used by both sides with independent keys (a React label
and a validation attribute name can translate differently); that is expected.

## Usage

```tsx
import { useTranslation } from '@/i18n/I18nProvider';

const { t } = useTranslation();

return <h2>{t('server.backups.title')}</h2>;
```

`t()` is strictly typed: `t('server.backups.titl')` is a compile error.

## Interpolation

Placeholders use `{{snake_case}}` and must be declared where the key is added:
`"files.saved": "Saved {{name}}!"` -> `t('files.saved', { name: file.name })`.

## Locale resolution

`user.language` -> `localStorage` override -> site default (admin setting) -> browser languages -> `en-US`.

- `setLocale(code)` persists the override, updates `document.documentElement.lang`, and fetches
  the locale dictionary from the panel (cached in memory for the session).
- Only `en-US` is bundled up front; every other dictionary is requested from
  `/locales/<code>/ui.json` on demand.
- The list of languages is injected into the page by the backend, so a folder dropped into
  `resources/lang` appears after a refresh with no frontend rebuild.
- New accounts are created with the admin-selected default language, and every user can override
  it from their account settings.
- The default site locale is treated as "no opinion" only when it is the canonical `en-US`, so a
  fresh visitor gets whichever shipped language their browser asks for.
- date-fns and cronstrue locales are resolved through `i18n/loader.ts` (best effort for dates).

## Adding a locale (no code changes)

1. `cp -r resources/lang/en-US resources/lang/fr-FR`
2. Translate `resources/lang/fr-FR/*.php` and `resources/lang/fr-FR/ui.json`.
3. Done. The backend discovers the folder and injects the language list; the dictionary is served
   by the panel. Refresh the page and it appears in the account selector, the first-run setup
   wizard and the admin default-language dropdown. No frontend rebuild required.
4. Optional: add the language to the date-fns map in `i18n/loader.ts` for localized dates; cron
   descriptions localize automatically.

A PHPUnit guard (`tests/Unit/I18n/LocaleSyncTest.php`) fails if a locale folder is missing its
`ui.json` or the JSON is malformed.

## Locale content rules (es-ES)

- Castilian Spanish from Spain, following RAE orthography (<https://www.rae.es/ortografia/>).
- Address the user impersonally or with `tú`; do not use `vosotros` outside explanatory prose.
- Use Spanish technical vocabulary: "contraseña" (password), "servidor" (server),
  "copia de seguridad" (backup), "tarea programada" (schedule), "huevo" (egg) and "nido" (nest).
- Keep placeholders and product names (`Hydrodactyl`, egg/nest proper names, file names) untranslated.
- Do not use em dashes (—) as clause separators; prefer a colon, a comma or parentheses.

## Verification

```
pnpm check
pnpm typecheck
pnpm exec vitest run
pnpm build
```
