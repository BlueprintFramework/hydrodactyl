# Hydrodactyl i18n Implementation Plan

> Lead-architect execution plan for a clean, dynamic, multi-language translation system across Laravel 13 + React 19 + TypeScript + Biome.
> Every task below is tightly scoped, independently implementable, and verifiable.

---

## 1. Research summary (current state)

| Area | Finding |
|---|---|
| Frontend i18n | **None exists.** No i18next/react-intl/formatjs/lingui. ~200 tsx/ts files, ~2,500 hardcoded English strings. |
| Backend i18n | `resources/lang/en/` exists (11 entries: activity, admin/, auth, command/, dashboard/, exceptions, pagination, passwords, server/, strings, validation). `trans()` used 105× in 46 files; `__()` used 0×. `LanguageMiddleware` sets locale from `$request->user()->language` — but registered in the **web** group only. |
| Client API errors | Hardcoded English: 105 literal `throw new *Exception('...')` across 70 files, 40 `BadRequestHttpException`, 21 `DisplayException`, ~20 `'error' => '...'` JSON literals. Duplicated trees: `app/Http/Controllers/Api/Client/Servers/Elytra/*` and `.../Wings/*`. |
| Locale data already in FE stores | `state/user.ts` → `UserData.language`; `state/settings.ts` → `SiteSettings.locale`. Both unused. |
| Locale auto-discovery | `app/Traits/Helpers/AvailableLanguages.php` scans `resource_path('lang')` dirs (ISO 639-1 two-letter codes only). Adding a new dir auto-registers it in admin settings + `User` validation. |
| Legacy locale endpoint | `GET /locales/locale.json?locale=xx&namespace=yy` (`app/Http/Controllers/Base/LocaleController.php`) serves PHP lang arrays as JSON converting `:foo` → `{{foo}}`; `LocaleRequest` regex enforces 2-letter locales. |
| Choke points | BE: `app/Exceptions/Handler.php` (JSONAPI `errors: [{code,status,detail}]`). FE: `resources/scripts/api/http.ts:44` `httpErrorToHuman()` reads `data.errors?.[0].detail`; notifications via sonner (~39 calls) + legacy `state/flashes.ts` + `FlashMessageRender`. |
| Dates/cron | date-fns v4 called **without** `locale` in 8 files; `cronstrue` English descriptions in `server/schedules/EditScheduleModal.tsx`. |
| Tests pin English copy | PHPUnit: 18 files, 86 `assertJsonPath('errors.0.detail')` + `expectExceptionMessage` literals. Vitest: 12 specs (`resources/scripts/**/*.spec.ts`), incl. `lib/server-operations.spec.ts`, `plugins/useFlash.spec.ts`, `lib/formatters.spec.ts`, `server/schedules/TaskDetailsModal.spec.ts`. |
| Tooling | `pnpm check` = Biome (`noExplicitAny: error`, `organizeImports`, 4-space, single quotes, lineWidth 120); `pnpm build` = Vite 8; `tsconfig.json` has `strict`, `resolveJsonModule: true`, `noEmit: true`; no `typecheck` script exists. Vitest config `include: resources/scripts/**/*.spec.ts`. |

**Golden rule that de-risks the entire migration: today's exact English copy becomes the canonical `en` values. All existing PHPUnit/vitest assertions stay green without edits.**

---

## 2. Locked architecture decisions

1. **Dual dictionary, one naming convention, single ownership per key.** No string is translated twice.
   - **Backend-owned** (Laravel `__()`, PHP arrays in `resources/lang/<locale>/`): `validation.*`, `exceptions.*`, `activity.*`, `auth.*`, `strings.*`, `command/*`, `dashboard/*`, `server/*`, `admin/*`.
   - **Frontend-owned** (typed JSON in `resources/scripts/i18n/locales/`): `common.*`, `navigation.*`, `panel.*`, `server.<module>.*`, `account.*`, `errors.*` (UI-level).
   - Backend-owned strings reach the UI **already localized** through API JSON (`errors.0.detail` → `httpErrorToHuman`). The frontend never re-translates them.
2. **Frontend transport**: `en.json` statically imported (canonical dictionary + compile-time key typing + per-key fallback). Other locales lazy `import()` code-split chunks via a **static** loader map (Vite requirement — never template-literal imports). No new npm dependencies.
3. **Interpolation**: frontend `{{var}}`; backend `:var` (native Laravel). Same conceptual syntax as the legacy `LocaleController` conversion.
4. **Locale resolution (FE)**: `localStorage` override (`plugins/usePersistedState.ts`) → `user.language` → `settings.locale` → `en`. Syncs `document.documentElement.lang`; feeds date-fns, cronstrue, captcha locale.
5. **Locale resolution (BE)**: `LanguageMiddleware` appended to the `client-api` group (user-scoped). `application-api` and `daemon` remain default English (machine consumers).
6. **Persistence**: existing `users.language` column (already fillable, validated, default `en`) → new `PUT /api/client/account/language` + account UI select; `localStorage` caches for instant boot.
7. **Locales**: `en` (canonical) + `es` (Castilian Spanish from Spain, following RAE rules — https://www.rae.es/ortografia/). Code stays `es`: `AvailableLanguages` (ISO 639-1) and `LocaleRequest` (`/^[a-z][a-z]$/`) only accept two-letter codes.
8. **Typing**: `t(key: TranslationKey, params?: TranslationParams): string`; `TranslationKey` = recursive `keyof` of canonical `en.json`. No `any` anywhere (Biome `noExplicitAny: error`).
9. **Test-stability rule** (see §1).
10. New backend code uses `__()`; existing `trans()` stays until Phase 21 unification.

---

## 3. Dictionary structure & naming convention

### 3.1 Frontend (canonical `resources/scripts/i18n/locales/en.json`)

```jsonc
{
  "common":     { "cancel": "Cancel", "confirm": "Confirm", "save": "Save", "delete": "Delete", "loading": "Loading..." },
  "navigation": { "console": "Console", "files": "Files", "databases": "Databases", "backups": "Backups" },
  "panel":      { "title": "Servers", "language": "Language", "log_out": "Log Out", "manage_server": "Manage Server" },
  "errors":     { "not_found": { "title": "Page Not Found", "description": "We couldn't find the page..." } },
  "server":     { "files": { "saved": "Saved {{name}}!" }, "console": { "power_starting": "Your server is starting!" } }
}
```

Rules:
- Lowercase `snake_case` segments; dots mirror the nested object path (`server.backups.delete_confirm`).
- Labels = nouns (`backups.title`); actions = verbs (`common.delete`); outcome messages = verb + state (`files.copy_success`); paired copy uses `_title` / `_description` suffixes.
- Interpolation params are always `{{snake_case}}` and must be listed in the task that introduces the key.
- Only `en.json` types are canonical; other locale files are deep-partial and fall back per key.

### 3.2 Backend mirrors (`resources/lang/es/`)

Mirror the 11 existing `en` entries exactly: `activity.php`, `admin/`, `auth.php`, `command/`, `dashboard/`, `exceptions.php`, `pagination.php`, `passwords.php`, `server/`, `strings.php`, `validation.php`. Add new keys inside the owning file (`exceptions.php`, `validation.php`, module files) — never a catch-all file.

---

## 4. Frontend infrastructure spec (new files)

| File | Purpose |
|---|---|
| `resources/scripts/i18n/locales/en.json` | Canonical dictionary; seeded with `common.*` + `navigation.*` + `panel.*` skeletons in P1. |
| `resources/scripts/i18n/types.ts` | `Translations` (= `typeof en`), recursive `TranslationKey`, `LocaleCode = 'en' \| 'es'`, `TranslationParams = Record<string, string \| number>`, `DeepPartial<T>`. |
| `resources/scripts/i18n/interpolate.ts` | `interpolate(template: string, params?: TranslationParams): string` replacing `{{key}}`; unmatched placeholders left intact. Plus `interpolate.spec.ts`. |
| `resources/scripts/i18n/loader.ts` | Static maps: `loaders: Record<LocaleCode, () => Promise<{ default: DeepPartial<Translations> }>>` with literal `import()` calls; `dateFnsLocales`, `cronstrueLocales`; `loadLocale(code)` returns merged (en + overrides) dictionary. |
| `resources/scripts/i18n/I18nProvider.tsx` | React Context + `useTranslation()` → `{ locale, setLocale, locales, t, ready }`. Resolution chain; async load for non-en with `ready` flag; en fallback; syncs `document.documentElement.lang`. `setLocale` updates localStorage + `document` + (via callback) user profile. |

Constraints:
- Biome: single quotes, 4-space indent, trailing commas, lineWidth 120, no `any`, `organizeImports` on.
- `noUncheckedIndexedAccess: true` → every dictionary lookup must be `?? fallback`-safe.
- Provider must be mounted in `resources/scripts/components/App.tsx` above the routers (en is static, so first paint never blocks).

## 5. Backend infrastructure spec

| Change | File |
|---|---|
| Append `LanguageMiddleware::class` to the `client-api` middleware group | `app/Http/Kernel.php` |
| New `UpdateLanguageRequest` (`language` required, `Rule::in(array_keys(getAvailableLanguages()))`) | `app/Http/Requests/Api/Client/Account/UpdateLanguageRequest.php` |
| New `AccountController::updateLanguage()` (uses `UserUpdateService`) | `app/Http/Controllers/Api/Client/AccountController.php` |
| Route `PUT /account/language` | `routes/api-client.php` (inside the existing `/account` prefix group, line ~45) |
| Replace 2 hardcoded fallback strings with `__()` (copy unchanged) | `app/Exceptions/Handler.php` (lines ~201, ~208) |
| Dynamic `<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">` | `resources/views/templates/wrapper.blade.php` |
| Add `HasLocalePreference` + `preferredLocale(): ?string` returning `$this->language` (localizes queued mail per recipient) | `app/Models/User.php` |

---

## 6. Execution phases

Each task lists: **scope → files → steps → acceptance criteria**.
Acceptance always includes the applicable commands from §7, plus a grep proving no target literals remain in that scope.

### Phase 0 — Tooling & conventions

- **P0.T1 — Add `typecheck` script + turbo task**
  Files: `package.json`, `turbo.json`.
  Steps: add `"typecheck": "tsc -p tsconfig.json"`; add `"typecheck": {}` task to turbo. Run it. If TS errors on `declaration`/`declarationMap` combined with `noEmit`, remove the two unused flags (nothing consumes declarations; Vite handles emit) and document in the commit message.
  Accept: `pnpm exec tsc -p tsconfig.json` exits 0.

- **P0.T2 — i18n convention guides**
  Files: `resources/scripts/i18n/README.md` (new), `resources/lang/README.md` (new).
  Steps: document key naming (§3), ownership matrix, `{{var}}` vs `:var`, "new strings MUST use keys" rule, `es` content rules (RAE orthography, `tú/usted` policy: UI copy uses impersonal/`tú`, never `vosotros` outside explanatory text), and the golden test-stability rule.
  Accept: files exist; no code changes.

### Phase 1 — Frontend infrastructure (new files only; no migration yet)

- **P1.T1 — Seed `en.json`**: create `i18n/locales/en.json` with `common`, `navigation`, `panel`, `errors` skeleton namespaces (values from existing UI copy).
- **P1.T2 — `types.ts`**: `Translations`, recursive `TranslationKey`, `LocaleCode`, `TranslationParams`, `DeepPartial<T>`.
- **P1.T3 — `interpolate.ts` + `interpolate.spec.ts`**: `{{var}}` replacement; spec covers missing params, repeated params, numbers.
- **P1.T4 — `loader.ts`**: static loader map (`en`, `es`), merged-dictionary loader, date-fns/cronstrue locale maps.
- **P1.T5 — `I18nProvider.tsx`**: context, resolution chain, `ready` flag, `setLocale` (persist + `document.lang` + user sync hook point).
- **P1.T6 — Wire provider**: mount in `components/App.tsx` above all routers.

Accept: `pnpm check`, `pnpm exec tsc -p tsconfig.json`, `pnpm exec vitest run`, `pnpm build` all green; a temporary probe `t('panel.title')` renders correctly; `document.documentElement.lang` follows locale.

### Phase 2 — Backend infrastructure

- **P2.T1** — `LanguageMiddleware` into `client-api` group (`app/Http/Kernel.php`). Verify `$request->user()` resolves for API-key requests; middleware is null-safe (`?? config('app.locale')`).
- **P2.T2** — `UpdateLanguageRequest` + `AccountController::updateLanguage()` + `PUT /account/language` route.
- **P2.T3** — `Handler.php` 2 fallbacks → `__('strings.error_processing_request')` / `__('strings.error_resource_not_found')` (new keys in `resources/lang/en/strings.php` with identical copy). Keep JSONAPI envelope untouched.
- **P2.T4** — `wrapper.blade.php` dynamic `<html lang>`.
- **P2.T5** — `HasLocalePreference` on `User`.

Accept: `php vendor/bin/phpunit` green (unchanged copy); `PUT /account/language` round-trips via client API; an authenticated error response renders in the user's language (manual check with `language=es` once P20 lands, `en` copy check before).

### Phase 3 — Global frontend chrome

- **P3.T1 — Navigation**: `routers/routes.ts` `name` fields → `navigation.*` keys; render via `t()` in `routers/UnifiedRouter.tsx`, `components/layout/sidebar/{Sidebar,MobileSidebar,NavItem}.tsx`, `components/layout/header/{AppHeader,UserDropdown}.tsx`, `components/elements/MobileTopBar.tsx`, `MobileFullScreenMenu.tsx`, `elements/commandk/CmdK.tsx` (incl. power toasts).
- **P3.T2 — Flash/notification chrome**: `state/flashes.ts` (`title: 'Error'` → key), `components/FlashMessageRender.tsx`, `components/MessageBox.tsx`, `plugins/useFlash.ts`.
- **P3.T3 — Shared screens**: `elements/ScreenBlock.tsx` (404/ServerError), `elements/ErrorBoundary.tsx`, `elements/Pagination.tsx`, `elements/ConfirmationsModal`/`dialog/*`, `elements/RetryDialog`-equivalents found in scope.
- **P3.T4 — Dates & cron**: inject locale into `lib/formatters.ts` (all date-fns calls) and update the 8 call sites: `components/dashboard/ssh/AccountSSHContainer.tsx`, `dashboard/AccountApiContainer.tsx`, `elements/activity/ActivityLogEntry.tsx`, `server/backups/BackupItem.tsx`, `server/schedules/{EditScheduleModal,ScheduleEditContainer,ScheduleRow}.tsx`, `server/files/FileObjectRow.tsx`; pass cronstrue `locale` in `server/schedules/EditScheduleModal.tsx`.

Accept: grep finds no literal label/menu/screen copy in those paths; `lib/formatters.spec.ts` green (en output unchanged).

### Phase 4 — Auth module
Files: `components/auth/{LoginContainer,LoginFormContainer,LoginCheckpointContainer,ForgotPasswordContainer,ResetPasswordContainer,StatusContainer}.tsx`.
Steps: labels/headings → keys; yup schemas use a factory receiving `t` (or `t` from context at schema construction inside component); error-code mapping in `LoginContainer.tsx:71` (`InvalidCredentials` etc.) → keys.
Accept: no English literals in scope; login flow manual pass.

### Phase 5 — Dashboard + account
Files: `components/dashboard/DashboardContainer.tsx`, `ServerRow.tsx`, `GroupSection.tsx`, `CreateGroupModal.tsx`, `AccountOverviewContainer.tsx`, `AccountApiContainer.tsx`, `ApiKeyModal.tsx`, `CreateApiKeyModal.tsx`, `activity/ActivityLogContainer.tsx`, `forms/{UpdateEmailAddressForm,UpdatePasswordForm,ConfigureTwoFactorForm,SetupTOTPDialog,DisableTOTPDialog,RecoveryTokensDialog,CreateApiKeyForm}.tsx`, `header/{SearchSection,FiltersMenu,FilterDropdown,SortDropdown,OwnerFilterDropdown,GroupDropdown,HeaderCentered}.tsx`, `ssh/{AccountSSHContainer,CreateSSHKeyForm,DeleteSSHKeyButton}.tsx`.
Accept: no English literals in scope.

### Phase 6 — Server console + header
Files: `components/server/console/{ServerConsoleContainer,Console,PowerButtons,StatBlock,StatGraphs,ChartBlock}.tsx`, `components/server/header/{ServerHeader,ServerDetailsHeader,PowerButtons,StatusPillHeader}.tsx`, `components/server/UptimeDuration.ts`.
Note: power toasts are duplicated ×2 (console + header) → shared `server.console.power_*` keys; `server-operations`-adjacent copy stays canonical.
Accept: no English literals in scope.

### Phase 7 — Server files
Files: `components/server/files/{FileManagerContainer,FileEditContainer,FileDropdownMenu,FileObjectRow,FileManagerBreadcrumbs,FileManagerStatus,MassActionsBar,UploadButton,NewFileButton,NewDirectoryButton,RenameFileModal,FileNameModal,ChmodFileModal,SelectFileCheckbox}.tsx`, `components/server/ConflictStateRenderer.tsx`.
Accept: no English literals in scope; `elements/CopyOnClick.tsx` toast included.

### Phase 8 — Server databases
Files: `components/server/databases/{DatabasesContainer,DatabaseRow,DatabaseConnectionModal,DeleteDatabaseModal,RotatePasswordButton}.tsx`.
Accept: no English literals in scope.

### Phase 9 — Server backups
Files: `components/server/backups/{BackupContainer,BackupItem,BackupContextMenu,useUnifiedBackups}.ts(x)`, `backups/components/{CreateBackupModal,ConfirmPasswordModal,BulkActionBar,BackupStats}.tsx`, `backups/elytra/BackupContextMenu.tsx`.
Notes: `**/elytra` is **excluded from Biome** — format manually to match style. Raw `alert()` calls (`BackupContextMenu.tsx:108`, `elytra/BackupContextMenu.tsx:171`): translate the string in place with `t()` — sonner upgrade is explicitly out of scope.
Accept: no English literals in scope.

### Phase 10 — Server network + schedules
Files: `components/server/network/{NetworkContainer,AllocationRow,SubdomainManagement,DeleteAllocationButton}.tsx`; `components/server/schedules/{ScheduleContainer,ScheduleEditContainer,EditScheduleModal,TaskDetailsModal,ScheduleRow,ScheduleTaskRow,ScheduleCronRow,ScheduleCheatsheetCards,DeleteScheduleButton}.tsx`.
Accept: no English literals in scope; `TaskDetailsModal.spec.ts` remains green (en copy unchanged).

### Phase 11 — Server settings + startup + users
Files: `components/server/settings/{SettingsContainer,RenameServerBox,ReinstallServerBox}.tsx`; `components/server/startup/{StartupContainer,VariableBox}.tsx`; `components/server/users/{UsersContainer,UserFormComponent,UserRow,CreateUserContainer,EditUserContainer,RemoveSubuserButton,PermissionRow,PermissionTitleBox}.tsx`; `state/server/subusers.ts` (28 permission description strings → dictionary with stable keys `server.users.permissions.<slug>`).
Note: `StartupContainer.tsx` has the highest string density in the repo — split into sub-tasks if it exceeds one review pass.
Accept: no English literals in scope.

### Phase 12 — Server software + installer + features + operations
Files: `components/server/software/{SoftwareContainer,SoftwareSelection,GameSelection,SoftwareConfiguration,SoftwareOverview,ReviewChanges,WipeConfirmationModal,DescriptionText}.tsx`; `components/server/installer/{InstallerContainer,InstallerCard,VersionPicker}` + `sources`, `eggFeatures`, `installedState`; `components/server/features/{Features,MclogsFeature}` + `eula/`, `JavaVersionModalFeature,PIDLimitModalFeature,GSLTokenModalFeature,SteamDiskSpaceFeature,HytaleOauthRequireFeature`; `components/server/operations/{OperationProgressModal,WingsOperationProgressModal}.tsx`; `lib/server-operations.ts`; `components/server/{InstallListener,TransferListener,WebsocketHandler,ServerActivityLogContainer}.ts(x)`, `elements/activity/{ActivityLogEntry,ActivityLogMetaButton}.tsx`.
Note: `lib/server-operations.spec.ts` asserts English copy — en values must stay byte-identical.
Accept: no English literals in scope; all 12 vitest specs green.

### Phase 13 — Setup wizard + admin widget
Files: `components/setup/SetupContainer.tsx`, `resources/scripts/admin/index.tsx`.
Note: server-rendered Blade admin (`resources/views/admin/*`) already uses `trans()` + `resources/lang/en/admin/*` and is out of scope.
Accept: no English literals in scope.

### Phase 14 — Backend: exception library
Files: `app/Exceptions/Http/Connection/DaemonConnectionException.php` (3), `app/Exceptions/Http/Server/ServerStateConflictException.php` (5), `app/Exceptions/{FileSizeTooLargeException,TooManyDatabasesException,BackupLockedException,DatabaseClientFeatureNotEnabledException,NoSuitableDatabaseHostException,TwoFactorAuthenticationTokenInvalid}.php`.
Steps: new keys under `resources/lang/en/exceptions.php` (same file, nested groups); replace literals with `__()`; **copy unchanged**. For `%s`-style dynamic parts use `:param` placeholders.
Accept: `phpunit` green; copy identical.

### Phase 15 — Backend: Elytra client tree + root client controllers
Files (order by severity): `app/Http/Controllers/Api/Client/Servers/Elytra/BackupsController.php` (12 `BadRequestHttpException` + 4 JSON literals), then `Elytra/{Startup,Settings,Schedule,ScheduleTask,NetworkAllocation,Websocket,Subdomain,ElytraJobs,Database,File,Subuser,Marketplace}Controller.php`; root `Api/Client/{AccountController,ApiKeyController,TwoFactorController,ServerGroupController}.php`; 3 FormRequests using `errors()->add()` (`Account/StoreSSHKeyRequest`, `Servers/Settings/PreviewEggChangeRequest`, `ApplyEggChangeRequest`).
Steps: new keys in a `client.php` namespace inside `exceptions.php` (or module files); convert stray `{'error': '...'}` / `{'message': '...'}` responses to localized `__()` values (envelope shape unchanged to avoid breaking consumers).
Accept: `phpunit` green; `rg "BadRequestHttpException\('[A-Z]" app/Http/Controllers/Api/Client` returns nothing.

### Phase 16 — Backend: Wings tree + FormRequests
Files: `app/Http/Controllers/Api/Client/Servers/Wings/{Backup,Startup,Settings,Schedule,ScheduleTask,NetworkAllocation,Websocket}Controller.php` — reuse the **exact keys** created in Phase 15 (no new strings); 5 FormRequests' literal `messages()` (`Databases/StoreDatabaseRequest`, `Settings/ServerOperationRequest`, `Settings/RevertDockerImageRequest`, `Admin/Settings/DomainFormRequest`, `Admin/Settings/LogoFormRequest`); 14 files' `attributes()` → `validation.attributes.*`.
Accept: `phpunit` green; Wings tree contains no distinct English literal not present in a lang file.

### Phase 17 — Backend: remote API
Files: `app/Http/Controllers/Api/Remote/{Backups/{BackupRemoteUploadController,BackupStatusController,BackupDeleteController,BackupSizeController},SftpAuthenticationController,Servers/ServerTransferController,RusticConfigController}.php` (~20 literals; note `BackupSizeController` also returns `'errors'` arrays manually).
Accept: `phpunit` green (SftpAuthentication/Backup tests included).

### Phase 18 — Backend: services, jobs, rules, middleware
Files: `app/Services/ServerOperations/{ServerStateValidationService,EggChangeService,ServerOperationService}.php`; `app/Services/Elytra/Jobs/BackupJob.php` + `Elytra/ElytraJobService.php`; `app/Services/Subdomain/SubdomainManagementService.php`; `app/Services/Dns/Providers/{CloudflareProvider,HetznerProvider,DNSimpleProvider}.php`; `app/Services/Backups/DownloadLinkService.php` + `Backups/Wings/DownloadLinkService.php`; `app/Services/Databases/DatabaseManagementService.php`; `app/Services/Schedules/ProcessScheduleService.php`; `app/Services/Servers/{BuildModificationService,SuspensionService}.php`; `app/Jobs/Server/ApplyEggChangeJob.php` + `Jobs/Schedule/RunTaskJob.php`; `app/Rules/{Fqdn,Username}.php`; 11 middleware literals (`VerifyCaptcha`, `Api/IsValidJson`, `Api/Daemon/DaemonAuthenticate`, `Api/AuthenticateIPAccess`, `Api/Client/RequireClientApiKey`, `Api/Application/AuthenticateApplicationUser`, `Api/Client/Server/ResourceBelongsToServer`, `Admin/Servers/ServerInstalled`, + 3 others in scope).
Notes: keep exact copy where tests use `expectExceptionMessage` (`DatabaseManagementServiceTest`, `DownloadLinkServiceTest`, `BuildModificationServiceTest`, `ProcessScheduleServiceTest`, `RunTaskJobTest`, `FindAssignableAllocationServiceTest`, `FqdnTest`).
Accept: `phpunit` green.

### Phase 19 — Backend: notifications + remaining strays
Files: `app/Notifications/{ServerInstalled,AddedToServer,RemovedFromServer,SendPasswordReset,AccountCreated,MailTested}.php` (localize via `__()`; `HasLocalePreference` from P2.T5 makes queued mail per-recipient); 2 admin literals (`Admin/Settings/MailController.php:55`, `Admin/Servers/ServerViewController.php:126`); `app/Http/Controllers/Base/SystemStatusController.php` (8 `RuntimeException` literals).
Out of scope (explicit decision): console command output (~12 CLI commands).
Accept: `phpunit` green; notification classes contain no literal English body copy outside `__()`.

### Phase 20 — `es` locale seed + end-to-end QA

- **P20.T1** — `resources/lang/es/` complete mirror (11 entries) following RAE orthography; register nothing manually (auto-discovered).
- **P20.T2** — `resources/scripts/i18n/locales/es.json` (full mirror of en, deep-partial allowed) + loader registration + date-fns `es` + cronstrue `es` in `loader.ts`.
- **P20.T3** — Account language switcher UI (select in `AccountOverviewContainer` area) calling the new API, updating `I18nProvider.setLocale`, and caching to localStorage.
- **P20.T4** — E2E QA checklist: switch to `es` and verify nav, toasts, tables, empty states, dates, cron text, API error details, validation messages, and reset-password email; verify missing-key fallback by temporarily deleting one `es` key (must fall back to en, not raw key); verify `<html lang="es">`.
- Accept: all suites green; QA checklist fully signed off.

### Phase 21 — Cleanup: `trans()` → `__()` unification
Scope: 105 `trans()` calls across 46 files (functionally identical helpers).
Steps: mechanical rename; run `php-cs-fixer --dry-run` + full `phpunit` after; no behavior change allowed.
Accept: zero `trans(` remaining in `app/`; all suites green.

---

## 7. Verification commands (run after each task)

```
pnpm check                                     # Biome lint + format (organizeImports)
pnpm exec tsc -p tsconfig.json                 # strict TS (script added in P0.T1)
pnpm exec vitest run                           # 12 frontend specs
pnpm build                                     # Vite production build
php vendor/bin/phpunit                         # all backend suites
php vendor/bin/phpstan analyse                 # phpstan.neon
php vendor/bin/php-cs-fixer fix --dry-run --diff
```

Per-task grep example (frontend scope): `rg "[A-Z][a-z]+ [a-z]+" resources/scripts/components/server/databases` reviewing JSX text/string props manually (heuristic).

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| `**/elytra` excluded from Biome | Manual formatting in P9; keep style identical to neighboring files. |
| Tests pin English copy (86 PHPUnit + 4 vitest specs) | Golden rule: en values byte-identical; only update assertions when a key restructure truly requires it. |
| `LanguageMiddleware` on `client-api` may not see a user for API-key requests | Middleware already null-safe; validate in P2.T1; fall back to panel locale if unresolved. |
| Locale codes are constrained to ISO 639-1 two-letter (`es`, never `es-ES`) | Documented; `LocaleCode` type enforces; `es-ES` is a content rule, not a code. |
| Vite cannot code-split template-literal imports | Loader map uses literal `() => import('...')` entries only. |
| tsconfig `declaration` + `noEmit` conflict | Resolved first in P0.T1. |
| Large migrations touching ~200 FE files | Phases are per-module; each accepted independently; sonner/flash/date-fns handled centrally in P3. |

---

## 9. Execution order recap

P0 → P1 → P2 → P3 → P4…P13 (FE modules, any order after P3) → P14…P19 (BE modules) → P20 → P21.

Dependency notes:
- P1/P2 are independent of each other.
- P3 depends on P1.
- P4–P13 depend on P1 + P3.
- P14–P19 depend on P2.
- P20 depends on P1–P19 (es dictionaries need all keys).
- P21 depends on P14–P19 (don't rename `trans()` in files being rewritten).

---

## 10. Execution status

All phases implemented on this branch. The machine used had **no Node/pnpm and no PHP/Composer**, so runtime verification is pending in your normal lerd/WSL environment.

| Phase | Status | Notes |
|---|---|---|
| P0 Tooling & conventions | Done | `typecheck` script + turbo task; removed `declaration`/`declarationMap` (TS5053 vs `noEmit`); i18n READMEs written |
| P1 FE infrastructure | Done | `i18n/{locales/en.json,types.ts,interpolate.ts,loader.ts,I18nProvider.tsx}` + spec; provider mounted in `App.tsx` |
| P2 BE infrastructure | Done | `LanguageMiddleware` in `client-api`; `PUT /api/client/account/language`; `Handler` fallbacks via `__()`; dynamic `<html lang>`; `HasLocalePreference` on `User` |
| P3 Global chrome | Done | routes/nav/sidebar/header/CmdK, flashes (title now localized at render), ScreenBlock/ErrorBoundary, Pagination (no copy), date-fns/cronstrue locale wiring per module |
| P4–P13 FE modules | Done | auth, dashboard/account, console/header, files, databases, backups (+elytra), network/schedules, settings/startup/users, software/installer/features/operations, setup/admin widget; final leftover sweep included |
| P14–P17 BE exceptions/controllers | Done | exceptions/middleware/rules; Elytra + Wings controllers (shared keys); root client + remote controllers; all FormRequests (`messages`, `attributes`, `$fail`) |
| P18–P19 BE services/notifications | Done | services, jobs, DNS/marketplace, 6 Notifications (new `notifications.php`), admin strays, `SystemStatusController`. Console command output intentionally excluded |
| P20 es locale | Done | `es.json` 1,233/1,233 keys; `resources/lang/es/` complete mirror (validation, auth, passwords, pagination, exceptions, strings, notifications, activity, command, admin/*, dashboard/*, server/users); language switcher in Account settings; new API function `api/account/updateAccountLanguage.ts` |
| P21 trans() → __() | Done | 105 call sites across 46 files renamed; 0 `trans(` remaining in `app/` |

### Static validation performed (no runtimes)

- `en.json` ↔ `es.json`: **1,233 = 1,233** leaf keys, 0 missing / 0 extra.
- Every static `t('...')` in `resources/scripts` resolves in `en.json`: **0 missing**.
- Every `__('...')` in `app/` + `resources/views` resolves against `resources/lang/en`: **0 missing** (normalized slash/dot namespaces).
- Fixed a pre-existing key mismatch: `exceptions.service.variables.*` → `exceptions.nest.variables.*` in `VariableUpdateService` (messages previously rendered the raw key).

### Remaining verification (run in a toolchain-enabled environment)

```
pnpm install
pnpm check
pnpm typecheck
pnpm exec vitest run
pnpm build
php vendor/bin/phpunit
php vendor/bin/phpstan analyse
php vendor/bin/php-cs-fixer fix --dry-run --diff
```

Manual E2E: switch language in Account settings → nav, toasts, modals, tables, dates, cron descriptions, validation/API errors, and reset-password email should render in Spanish; delete one `es.json` key temporarily to confirm English per-key fallback; confirm `<html lang="es">` after switching.

---

## 11. Post-audit re-check (second pass)

A full audit after execution found and fixed the following:

- **Admin Blade views were untranslated** — the original plan assumed they already used `trans()`, which was false (62/65 files had no i18n helper). **Phase P22** added to scope at user request and completed:
  - Chrome: `layouts/admin.blade.php`, `partials/admin/settings/nav.blade.php`, `admin/index.blade.php` (new `admin/navigation.php` + `admin/index.php`).
  - All feature areas: `admin/api`, `admin/databases`, `admin/eggs`, `admin/locations`, `admin/mounts`, `admin/nests`, `admin/nodes`, `admin/s3`, `admin/servers`, `admin/settings`, `admin/users`, plus the earlier `admin/settings/domains` (new `admin/domains.php`).
  - New/extended lang files (en + es): `admin/{navigation,index,api,databases,domains,eggs,locations,mounts,s3,settings}.php` and extended `admin/{user,node,nests,server}.php`.
  - Blade conventions applied: `{{ __('admin/...') }}`, `@js(__('...'))` for JS strings, `{!! !!}` for HTML-bearing values, `:placeholders` preserved.
- **Backend gaps closed**: `ServerOperation::markAsStarted/markAsCompleted` default messages; `DomainsController` + `Admin\Settings\Providers` enum descriptions; `SetupController` abort message; fixed pre-existing `exceptions.service.variables.*` → `exceptions.nest.variables.*` mismatch; fixed a missing `:daemon` placeholder pair in `es/admin/node.php`.
- **Frontend gaps closed**: `XtermScrollDownHelperAddon` labels (new labels-getter + Console wiring), `BottomNav` aria-label, `Console` scroll button keys.
- **Intentionally excluded from P22**: `resources/views/scribe/index.blade.php` (auto-generated API docs), `resources/views/vendor/*` (pagination only has symbols; notifications email template is unreferenced by the app notifications), `resources/views/templates/*` (no copy), console command output (user decision).

### Final static validation numbers (no runtimes)

| Check | Result |
|---|---|
| `en.json` ↔ `es.json` | 1,236 = 1,236 keys, 0 missing/extra, 0 placeholder mismatches, no duplicate keys, sorted, LF/4-space |
| Frontend `t(...)` literals (incl. ternaries) | 1,344, 0 missing (1 false positive: `websocket.connect` is a permission identifier) |
| PHP/Blade `__()` references | 1,488, 0 unresolved (1 parser false positive: `validation.username_format` is a pre-existing multi-line value) |
| PHP lang en↔es parity | 26 files per locale, 0 missing/extra, 0 placeholder mismatches |
| Lang file bracket balance (PHP) | 52/52 files balanced |
| `tests/` directory | untouched |
| Scope of changes | only `app/`, `resources/`, `routes/api-client.php`, `plan.md`, `package.json`, `tsconfig.json`, `turbo.json` |

The same runtime verification commands from §10 remain pending in a toolchain-enabled environment.

---

## 12. Post-release feature: full locale codes + auto discovery

Added after the initial rollout, at the maintainer's request:

- Locale codes are now full BCP-47-ish strings (`en-US`, `es-ES`, `fr-FR`). The canonical
  dictionaries moved to `resources/lang/en-US/` and `resources/scripts/i18n/locales/en-US.json`.
- **Auto discovery**: dropping `resources/lang/<code>/` and `i18n/locales/<code>.json` is all it
  takes. The backend scans the lang folder (`AvailableLanguages`); the frontend uses
  `import.meta.glob`, so the language appears in the account selector, the first-run setup wizard
  and the admin default-language dropdown with no code changes.
- `AvailableLanguages` names locales with the `intl` extension (ISO 639-1 fallback); the Docker
  image now installs `intl` so display names work there too.
- Locale resolution gained browser-language detection as a final fallback, so fresh visitors get a
  shipped language automatically.
- The `/setup` wizard has a language picker and stores the chosen language on the admin account it
  creates.
- `users.language` widened to 16 chars; a migration upgrades existing `en`/`es` rows and the
  `settings::app:locale` value.
- Verified on the Ubuntu VM: Biome 0, typecheck back at the 376-error pre-existing baseline,
  PHPUnit 694 green, Vitest 130 green, build OK, `es-ES` chunk emitted, panel serving HTTP 200,
  and a throwaway `fr-FR` folder was auto-discovered by both layers before being removed.


