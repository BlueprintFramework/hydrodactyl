<p align="center">
  <a aria-label="Read the Hydrodactyl introduction blog post" href="https://blueprint.zip/blog/introducing-hydrodactyl">
    <img alt="Hydrodactyl Banner" src=".github/banner_v6.jpg">
  </a>
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
  <a href="https://github.com/BlueprintFramework/hydrodactyl/releases">
    <img src="https://shieldcn.dev/badge/Release-v6.3.0-181717.svg?logo=github" alt="Latest release: v6.3.0">
  </a>
  <img src="https://shieldcn.dev/badge/Formatted%20with-Biome-93c5fd.svg?logo=biome" alt="Formatted with Biome">
  <img src="https://shieldcn.dev/badge/Linted%20with-Biome-93c5fd.svg?logo=biome" alt="Linted with Biome">
</p>

<br/>

Hydrodactyl is a modern, performance-focused game server management panel forked from Pterodactyl. It delivers smaller bundles, faster builds, and an accessible, reimagined interface.

## Features

- **Reimagined client panel** — a redesigned interface for console, files, databases, backups, network, users, startup, schedules, activity, and software.
- **Marketplace** — a native plugin and mod installer for Minecraft servers backed by Modrinth, Hangar, and Spiget.
- **Setup wizard** — guided first-run configuration for new installations.
- **Logo customization** — custom branding for your panel from the admin dashboard.
- **S3-compatible backups** — per-node backup storage with any S3-compatible provider.
- **PostgreSQL support** — run the panel on MySQL, MariaDB, or PostgreSQL.
- **OpenAPI documentation** — API reference powered by Scalar.
- **Modern stack** — Laravel 13, React 19, TypeScript, and Tailwind CSS, formatted and linted with Biome.

> [!WARNING]
> **Pre-release Software:** Hydrodactyl is currently under active development. Some UI elements may appear broken and bugs may exist.
>
> **Incompatibility Notice:** Hydrodactyl is an all-in-one panel and is **not compatible** with Blueprint framework extensions.

> [!NOTE]
> Please review the official documentation at [hydrodactyl.dev](https://hydrodactyl.dev/docs/hydrodactyl) before installing.

![Dashboard Image](./.github/server_menu.jpeg)

Built by the maintainer of the original Pyrodactyl project and funded by Blueprint.

## Quick start

```bash
git clone https://github.com/BlueprintFramework/hydrodactyl.git
cd hydrodactyl
cp .env.example .env
cp docker-compose.example.yml docker-compose.yml
docker compose up -d
```

See the [Installation Guide](https://hydrodactyl.dev/docs/hydrodactyl/installation) and [Local Development Guide](https://hydrodactyl.dev/docs/hydrodactyl/local-development) for detailed instructions.

> [!NOTE]
> Windows is supported for **local development only**.

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

- [Donate on Ko-fi](https://ko-fi.com/naterfute): Support the maintainer.
- [Donate to Blueprint Framework](https://bpfw.io/donate): Support the nonprofit funding Hydrodactyl.
- [Join the Discord](https://discord.gg/sK686yHdaK): Chat with the community and get support.
- **Star the repository**: Share it with others to help more people discover Hydrodactyl.
