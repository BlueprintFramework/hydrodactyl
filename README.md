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
    <img src="https://shieldcn.dev/badge/Formatter-Biome-60a5fa.svg?logo=biome" alt="Formatted with Biome">
    <img src="https://shieldcn.dev/badge/Linter-Biome-60a5fa.svg?logo=biome" alt="Linted with Biome">
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

Prerequisites are managed via [mise](https://mise.jdx.dev/) (formerly rtx). Install it, then run:

```bash
mise install        # install php, node, pnpm
just install        # composer install + pnpm install
just dev            # start vite dev server
```

Other useful recipes:

| Command | Description |
|---------|-------------|
| `just build` | Production build |
| `just lint` | Biome lint (auto-fix) |
| `just check` | Biome check |
| `just test` | PHPUnit tests |
| `just analyse` | PHPStan static analysis |
| `just cs-fix` | PHP CS Fixer |
| `just up` | Docker Compose up |
| `just artisan <cmd>` | Run artisan command |

Run `just` to list all available recipes.

## License

Hydrodactyl is open-source software licensed under the **Apache License 2.0**.

You are free to use, modify, and redistribute Hydrodactyl under the terms of the license. A copy of the full license text is available in the [LICENSE](./LICENSE) file included in this repository.

The original Pterodactyl panel is also available under the **MIT License** — see [LICENSE_MIT.md](./LICENSE_MIT.md).

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
