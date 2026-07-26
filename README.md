<p align="center">
<a aria-label="Read the Hydrodactyl introduction blog post" href="https://blueprint.zip/blog/introducing-hydrodactyl?utm_source=githubreadme&utm_medium=readme&utm_campaign=HYDRODACTYL&utm_id=HYDRODACTYL"><img alt="" src=".github/banner_v6.jpg"></a>
</p>
<p align="center">
    <a href="https://discord.gg/sK686yHdaK">
        <img src="https://shieldcn.dev/badge/Discord-Join%20the%20community-5865F2.svg?logo=discord" alt="Join the Discord">
    </a>
    <a href="https://blueprint.zip/blog/introducing-hydrodactyl">
        <img src="https://shieldcn.dev/badge/Blog-Read%20the%20announcement-0ea5e9.svg?logo=readme" alt="Read the blog post">
    </a>
</p>
<br/>
<h1 align="center">Hydrodactyl</h1>
<p align="center">
    <a href="https://github.com/BlueprintFramework/hydrodactyl/actions/workflows/dev-build.yaml">
        <img src="https://shieldcn.dev/badge/Build-Passing-success.svg?logo=githubactions" alt="Build">
    </a>
    <img src="https://shieldcn.dev/badge/PHP-8.4+-8892BF.svg?logo=php" alt="PHP 8.4+">
    <img src="https://shieldcn.dev/badge/Formatter-Biome-60a5fa.svg?logo=biome" alt="Formatted with Biome">
    <img src="https://shieldcn.dev/badge/Linter-Biome-60a5fa.svg?logo=biome" alt="Linted with Biome">
    <img src="https://shieldcn.dev/badge/License-Apache%202.0-blue.svg" alt="License">
</p>

<br/>

Hydrodactyl is a modern, performance-focused game server management panel forked from Pterodactyl. It delivers smaller bundles, faster builds, and an accessible, reimagined interface.

- Not compatible with Blueprint extensions — this is an all-in-one solution.
- Pre-release software. Some UI elements may appear broken and bugs may exist.
- Logo customization is experimental and subject to change.
- Read the docs at [hydrodactyl.dev](https://hydrodactyl.dev/docs/hydrodactyl) before installing.

![Dashboard Image](./.github/server_menu.jpeg)

Built by the maintainer of the original Pyrodactyl project and funded by Blueprint.

## Quick start

```bash
git clone https://github.com/BlueprintFramework/hydrodactyl.git
cd hydrodactyl
cp .env.example .env
docker compose up -d
```

See the [Installation Guide](https://hydrodactyl.dev/docs/hydrodactyl/installation) and [Local Development Guide](https://hydrodactyl.dev/docs/hydrodactyl/local-development) for detailed instructions. Windows is supported for local development only.

![Dashboard Image](./.github/dashboard.jpeg)

## Development

Hydrodactyl uses [mise](https://mise.jdx.dev) for tool version management and [just](https://just.systems) as a command runner. Install them first, then run `mise install` to set up the correct PHP, Node, and pnpm versions.

### Prerequisites

| Tool                                          | Purpose                                              |
| --------------------------------------------- | ---------------------------------------------------- |
| [Docker](https://docs.docker.com/get-docker/) | Container runtime for the dev stack                  |
| [mise](https://mise.jdx.dev)                  | Manages PHP, Node, pnpm, and docker-compose versions |
| [just](https://just.systems)                  | Command runner (like Make, but simpler)              |

### Getting started

```bash
# Install tool versions (PHP 8.4, Node LTS, pnpm, docker-compose)
mise install

# Start the full development stack (MariaDB, Redis, Panel, MinIO, Elytra, Mailpit)
just dev

# Or rebuild everything from scratch
just dev-build
```

The panel will be available at `http://localhost:3000`.

### Available commands

Run `just` to see all available recipes:

| Command                 | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `just dev`              | Start the development stack                                 |
| `just dev-build`        | Rebuild and start the stack                                 |
| `just dev-down`         | Stop the development stack                                  |
| `just dev-logs`         | View container logs                                         |
| `just lint`             | Run Biome linter with auto-fix                              |
| `just check-frontend`   | Check frontend formatting                                   |
| `just build`            | Build frontend assets                                       |
| `just phpstan`          | Run PHPStan static analysis                                 |
| `just cs-fix`           | Fix PHP code style                                          |
| `just cs-check`         | Check PHP code style                                        |
| `just test`             | Run all tests                                               |
| `just test-unit`        | Run unit tests only                                         |
| `just test-integration` | Run integration tests only                                  |
| `just check`            | Run full quality pipeline (lint + format + phpstan + tests) |
| `just clear`            | Clear Laravel caches                                        |
| `just migrate`          | Run database migrations                                     |
| `just seed`             | Seed the database                                           |

### Tech stack

- **Backend**: PHP 8.4+ / Laravel 13
- **Frontend**: React 19 / TypeScript 5.9 / Vite 7
- **Database**: MariaDB (MySQL compatible)
- **Cache**: Redis
- **Object Storage**: MinIO (S3-compatible, for backups)
- **Daemon**: [Elytra](https://github.com/PyroHost/elytra) (Wings fork)
- **Linting**: Biome (JS/TS), php-cs-fixer (PHP), PHPStan (static analysis)
- **Testing**: PHPUnit 12, Vitest

## UUIDv7

Hydrodactyl uses **UUIDv7** for all entity identifiers. UUIDv7 encodes a Unix timestamp in the most significant bits, providing:

- **Time-ordered generation** — UUIDs are naturally sortable by creation time
- **Better index performance** — sequential keys improve InnoDB clustered index efficiency
- **Backward compatibility** — existing UUIDv4 records are untouched; mixed v4/v7 databases work transparently

The `UuidService` class at `app/Services/UuidService.php` is the single generation point. See the [UUIDv7 migration PR](https://github.com/BlueprintFramework/hydrodactyl/pull/83) for implementation details.

## License

Hydrodactyl is open-source software licensed under the **Apache License 2.0**.

You are free to use, modify, and redistribute Hydrodactyl under the terms of the license. A copy of the full license text is available in the [LICENSE](./LICENSE) file included in this repository.

### Copyright & Attribution

Hydrodactyl is built upon the work of previous open-source projects and their contributors:

- **Pterodactyl®**: Copyright © 2015–2022 Dane Everitt and contributors.
- **Pyrodactyl™**: Copyright © 2023–2025 Pyro Inc. and contributors.
- **Pyrodactyl™**: Copyright © 2025–2026 Pyrodactyl-oss and contributors.
- **Hydrodactyl**: Copyright © 2026–present Naterfute, Blueprint Framework, and contributors.

All original copyright notices, license notices, and attributions must remain intact when redistributing this software.

Unless explicitly stated otherwise, all source code within this repository is licensed under the **Apache License 2.0**.

## Support

Help Hydrodactyl grow by supporting the project:

- [Donate on Ko-fi](https://ko-fi.com/naterfute): support the maintainer.
- [Donate to Blueprint Framework](https://bpfw.io/donate): support the nonprofit funding Hydrodactyl.
- [Join the Discord](https://discord.gg/sK686yHdaK): chat with the community and get support.
- Star the repository and share it with others: it helps more people discover Hydrodactyl.

<br>

<p align="center">
    <a href="https://github.com/BlueprintFramework/hydrodactyl/graphs/contributors">
        <img src="https://shieldcn.dev/contributors/BlueprintFramework/hydrodactyl.svg?preset=grid&names=true&bots=true&titleAlign=center&mode=dark&watermark=true" alt="BlueprintFramework/hydrodactyl contributors">
    </a>
</p>
