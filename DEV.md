<h1 align="center">Hydrodactyl — Local Development</h1>

<p align="center">
  <img src="https://shieldcn.dev/badge/Formatted%20with-Biome-93c5fd.svg?logo=biome" alt="Formatted with Biome">
  <img src="https://shieldcn.dev/badge/Linted%20with-Biome-93c5fd.svg?logo=biome" alt="Linted with Biome">
</p>

<br/>

This guide covers setting up a local Hydrodactyl development environment. For production deployments, see the [Installation Guide](https://hydrodactyl.dev/docs/hydrodactyl/installation).

> [!NOTE]
> A full walkthrough is also available in the [Local Development Guide](https://hydrodactyl.dev/docs/hydrodactyl/local-development).

## Prerequisites

| Tool | Version |
| --- | --- |
| PHP | `^8.4` |
| Node.js | `>= 22.13` |
| pnpm | `11.x` (see [`package.json`](./package.json)) |
| Lerd | Latest (used for the dev environment, see [`.lerd.yaml`](./.lerd.yaml)) |
| Docker | Optional, for containerized development |

> [!NOTE]
> Windows is supported for **local development only**.

## Quick start

```bash
pnpm install
pnpm dev:setup
pnpm dev
```

`pnpm dev:setup` runs [`bin/devSetup.sh`](./bin/devSetup.sh), which:

1. Boots the development environment with Lerd (see [`.lerd.yaml`](./.lerd.yaml) for the configured services: MariaDB, PostgreSQL, Valkey, Mailpit, and more).
2. Configures local S3-compatible storage via MinIO.
3. Seeds a default administrator account.
4. Creates a development node and starts the [Elytra](https://github.com/pyrohost/elytra) daemon.

### Default login

| Field | Value |
| --- | --- |
| Email | `dev@hydrodactyl.dev` |
| Password | `dev` |

## Available scripts

The following commands are defined in [`package.json`](./package.json):

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the Vite development server with hot reload |
| `pnpm dev:setup` | Bootstrap the full local development environment |
| `pnpm build` | Build frontend assets |
| `pnpm lint` | Run Biome and apply fixes |
| `pnpm check` | Run Biome checks |
| `pnpm test` | Run the PHPUnit test suite |
| `pnpm test:unit` | Run the unit test suite only |
| `pnpm test:integration` | Run the integration test suite only |

## Running the test suite

```bash
composer install
pnpm test
```

Tests are split into `Unit` and `Integration` suites and run against MySQL, MariaDB, and PostgreSQL on PHP 8.4 and 8.5 in CI. See [`.github/workflows/tests.yml`](./.github/workflows/tests.yml) for details.

## Docker-based development

An alternative containerized environment is available via [`docker-compose.develop.yml`](./docker-compose.develop.yml), which additionally provisions MinIO (S3 backups) and an Elytra daemon:

```bash
docker compose -f docker-compose.develop.yml up -d --build
```

The panel is then reachable on `http://localhost:3000`.

> [!WARNING]
> The `docker-compose.develop.yml` environment is intended for development only and should never be used in production.

## Contributing

Interested in helping out? Check out [CONTRIBUTING.md](./CONTRIBUTING.md) and [SECURITY.md](./SECURITY.md).
