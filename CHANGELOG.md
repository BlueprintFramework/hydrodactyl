<h1 align="center">Changelog</h1>

<br/>

This file is a running track of new features and fixes for each version of the Hydrodactyl panel.

This project follows [Semantic Versioning](http://semver.org) guidelines.

> [!NOTE]
> Hydrodactyl is currently in active development (`canary`). Version `v6.0.0` marks the first release under the Hydrodactyl name, which is a fork of [Pyrodactyl](https://github.com/pyrohost/pyrodactyl). Releases before `v6.0.0` are part of the Pyrodactyl history.

## [Unreleased]

### Changed
- Updated Paper egg to download the server jar without corruption.
- Added Java 18 back to supported egg versions.
- Removed the plugin option for Limbo server eggs.
- Switched Purpur egg features from `plugin/purpur` to `plugin/paper`.

### Fixed
- Discord link in the admin dashboard.

## v6.3.0 - 7/25/26

### Added
- Custom navigation items for servers.
- Toast notification when setting a new primary allocation.

### Fixed
- Copying text from the terminal.
- UI reverting when saving in the file editor.
- Sidebar overflow and scrollbar issues.
- Mobile bottom navbar rendering custom nav items.

## v6.2.3 - 7/22/26

### Added
- OpenAPI documentation powered by Scalar.
- CDN options for static assets.
- Copy-to-clipboard on server IP addresses.

### Changed
- Renamed remaining Pterodactyl references to Hydrodactyl names.
- Increased rate-limit on the files/pull endpoint.
- Removed the API limit on marketplace downloads.

### Fixed
- Marketplace download failures.

## v6.2.2 - 7/15/26

### Fixed
- Unable to save the S3 region ID in the admin panel.

## v6.2.1 - 7/15/26

### Added
- Mobile bottom navigation bar.
- Mobile scroll, scroll-to-bottom, and stdin lock for the console.
- Reconnect the console socket when the tab regains visibility.
- Bunny.net as a supported DNS provider.
- Mobile-friendly auth page layouts and responsive spacing.

### Fixed
- Scheduled backups not running.
- Unsupported subdomain controls being shown.
- Unlimited frontend feature limits.
- Schedule task creation loading loop.
- Backup storage labels now use IEC units.
- Sidebar malformed layout in most cases.
- Reverted a fix meant to weed out issues with specific configurations.

### Removed
- ESLint and Prettier (Biome is now the single linter/formatter).

## v6.2.0 - 7/07/26

### Added
- Hydrodactyl favicon and logo across the panel.
- Server sorting, filtering, and search on the dashboard.
- New game server eggs.
- Expanded test matrix covering MySQL, MariaDB, and PostgreSQL on PHP 8.4 and 8.5.

### Fixed
- Activity page not rendering.
- Dashboard resource graphs looping.
- PostgreSQL sort failures and filter overflow.
- CI test failures.

## v6.1.0 - 7/06/26

### Added
- **Marketplace:** native plugin/mod installer for Minecraft servers with install history.
- Marketplace service layer supporting Modrinth, Hangar, and Spiget.
- Client API and database-backed install tracking.
- Version checking and release types for the panel.

### Fixed
- API key creation.
- Renamed the VintageStory subdomain feature.

## v6.0.4 - 7/04/26

### Added
- First-run **setup wizard** for new installations.
- **Logo customization** in the admin panel (with history and deduplication).
- Admin overview charts (CPU, memory, disk) with recharts.
- Dynamic favicon and a dark support modal.

### Changed
- Dropped PHP 8.3 support.
- Rebranded remaining `pyro` references to Hydrodactyl.

### Fixed
- Server status icon missing.
- Users not being found on the server creation page.
- Chart overflow and sidebar logo alignment.

## v6.0.3 - 7/02/26

### Changed
- Upgraded Laravel `12.x` → `13.x`.

### Fixed
- Docker build.
- Switched back to pnpm for package management.

## v6.0.2 - 7/02/26

### Fixed
- Variable names changed from `pyro` to `hydrodactyl` across the codebase.

## v6.0.1 - 7/02/26

### Fixed
- Mobile UI improvements.
- Docker Compose example file.

## v6.0.0 - 7/02/26

The first release under the Hydrodactyl name.

### Added
- **Rebrand** from Pyrodactyl to Hydrodactyl.
- Reworked **software page** with game selection and review flows.
- S3-compatible **backup support** (per-node).
- New local development environment using [Lerd](./.lerd.yaml) and automated setup.

### Changed
- Complete client-side UI redesign: console, files, databases, backups, network, users, startup, schedules, activity, and software pages.
- Updated README, banner, and branding assets.
- Modernized user and schedule forms.

### Removed
- Legacy software changer and unused components.

---

## Pre-Hydrodactyl history

The following releases were published under the **Pyrodactyl** project before the fork:

### V4.1.0 - 7/24/25

### Fixed
- Certain icons not showing up on Safari.
### Added
- Deduplicated backups using the new Elytra Daemon.
### Removed
- Support for Pterodactyl Wings is ending.

### V4.0.0 - 7/07/25

> [!NOTE]
> v4.0.0 did not make any breaking changes. It was bumped from 3.0.0 to give a fresh starting point from the `dns_manager` addon.

### Added
- Dns Manager and Cloudflare DNS manager for subdomains.
- **Egg Features:** new service egg variables `subdomain_minecraft`, `subdomain_factorio`, and `subdomain_rust` for SRV records.
### Fixed
- Mobile sidebar turned into a navbar to work better and be more navigatable.
