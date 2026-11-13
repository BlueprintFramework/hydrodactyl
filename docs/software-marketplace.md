# Software, marketplace, modpacks, and temporary backups

Operator-facing contract for the Hydrodactyl client Software wizard, marketplace installer, Modrinth modpack installs, and the 72h software-change backup slot. All of this is native Laravel + React — no Blueprint-style core overlays.

## Detection model (what “autodetect” means)

There is **no** filesystem JAR sniffing. Detection is declarative:

1. **Egg `features`** — source of truth for nav and API gates (`mod/fabric`, `plugin/paper`, …). `DestinationResolver` and `supportsType()` / `loadersFor()` read these tags.
2. **Name heuristics** — `eggNameToMcjarsType()` maps egg display names → MCJars `TYPE` keys for the Software version picker. Bedrock / PocketMine / Waterdog-style names are excluded from the flat Minecraft catalog.
3. **`hybridEggFeatures`** — merges extra `mod/*` / `plugin/*` tags for hybrid eggs whose DB features lag (Arclight, Mohist, …).
4. **Modpack index** — `MrpackParser` reads `modrinth.index.json`; `LoaderEggResolver` maps fabric/forge/neoforge/quilt + Minecraft version → nest egg, Docker image, and env defaults.

Wrong-egg recovery is user-driven (Software change), not automatic from `server.jar`.

## Software change (versions + categories)

Flow:

```
overview → select-game (all nests) → select-software
  → Minecraft MCJars eggs → select-version → review → ApplyEggChangeJob
  → other nests           → configure     → review → ApplyEggChangeJob
```

- Categories come from linked nests (names prefixed with `!` stay hidden).
- Minecraft catalog filters to MCJars Java types; icons live in `public/icons/mcjars`.
- Version install writes the chosen version into **every** egg env matching `*_VERSION` / `MC_VERSION`, plus `BUILD_NUMBER` when present.
- Build picker defaults to the newest build; a compact select appears when multiple builds exist.
- Proxy API: `GET /api/client/servers/{server}/mcjars/versions|builds` (permission `startup.software`). Documented in `public/docs/openapi.yaml`.

## Marketplace plugins / mods

- Sources: Modrinth, Hangar, Spiget (plugins); Modrinth for mods.
- Client routes under `/api/client/servers/{server}/marketplace/*`.
- Nav gated by egg features (`plugin/*`, `mod/*`).
- Spiget `externally_hosted` resources may not resolve to a direct file URL — the UI surfaces provider errors rather than a silent no-op.

## Modpacks (Modrinth `.mrpack` only)

- UI: `/server/:id/installer/modpacks` (`ModpackContainer`).
- API: `POST /api/client/servers/{server}/marketplace/modpack/install`.
- Job: `ApplyModpackInstallJob` on queue **`standard`**, timeout **3600s**, unique per server.
- Pipeline: stop → optional 72h backup → optional wipe → egg/Java/startup → reinstall wait → materialize mods + overrides.
- Progress: `rememberServerOperation(..., 'modpack_install')` + `ActiveServerOperationModal` (survives refresh).
- CurseForge is **not** implemented.

**Production requirement:** a queue worker must consume `standard` (or Horizon include it) with PHP `zip` and enough memory/disk for large packs.

## Temporary software-change backups

Contract:

| Rule | Detail |
|------|--------|
| Slot | One `is_software_change` backup per server |
| TTL | `expires_at` = now + 72 hours |
| Shared by | `egg_change` and `modpack_install` |
| Limit | Prior slot purged before creating the next; Wings create uses `override=true` |
| Prune | `p:maintenance:prune-software-change-backups` hourly |
| Delete path | Daemon-aware via `SoftwareChangeBackupService` (Wings / Calagopus / Elytra job) |
| Elytra tagging | Match by **exact backup name** after the create job finishes (not “newest non-software-change”) |

Client API exposes `is_software_change` and `expires_at` on backup attributes (`ClientBackupAttributes` in OpenAPI). The backups list shows a “Temporary” badge with expiry tooltip.

## Related config

- `config/hydrodactyl.php` — `marketplace.*`, `mcjars.*`
- `config/server_operations.php` — `modpack_install` / egg-change timeouts
- Env: `MCJARS_*`, marketplace source toggles as documented in that config file
