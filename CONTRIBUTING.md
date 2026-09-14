<h1 align="center">Contributing to Hydrodactyl</h1>

<br/>

Thanks for your interest in contributing to Hydrodactyl! This document outlines how to get involved, report issues, and submit code. Please also review [SECURITY.md](./SECURITY.md) before reporting a vulnerability.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report bugs** by opening an issue on GitHub. Please include steps to reproduce, expected behavior, and the Hydrodactyl version you are using.
- **Request features** by opening an issue. Describe the problem you are trying to solve and how the feature would help.
- **Submit code** by opening a pull request with a clear description of the change.
- **Chat with us** on [Discord](https://discord.gg/sK686yHdaK) and help others in the community.

> [!TIP]
> Before opening a pull request, please search the existing issues and pull requests to make sure the work hasn't already been proposed.

## Responsible disclosure

Hydrodactyl is a complex project that makes use of many components. We strive to keep everything as secure as possible and welcome you to audit the code yourself. We do ask that you be considerate of others using the software and **do not publicly disclose security issues before contacting us**.

Here's the deal: if you report an issue to us by email and we fail to respond within **one week**, you are welcome to publicly disclose what you found. This holds us to a standard of providing prompt attention to any issues that arise and keeping this community safe.

If you've found what you believe is a security issue, please email **[naterfute@blueprint.zip](mailto:naterfute@blueprint.zip)** and check [SECURITY.md](./SECURITY.md) for additional details.

> [!WARNING]
> Do not report security vulnerabilities through public channels or GitHub Issues.

## Getting started

Follow the [Local Development Guide](./DEV.md) to set up a working development environment. You'll need PHP `^8.4`, Node.js `>= 22.13`, and pnpm.

## Code style

We use [Biome](https://biomejs.dev) for linting and formatting frontend code, and [PHP CS Fixer](https://github.com/PHP-CS-Fixer/PHP-CS-Fixer) plus [PHPStan](https://phpstan.org) for the PHP codebase.

Run the checks before submitting your changes:

```bash
pnpm lint    # Biome: apply lint fixes
pnpm check   # Biome: verify formatting and linting
```

## Testing

All changes should keep the test suite passing:

```bash
pnpm test                 # PHPUnit
pnpm test:unit            # Unit suite
pnpm test:integration     # Integration suite
```

The CI pipeline runs the full test matrix against MySQL, MariaDB, and PostgreSQL on PHP 8.4 and 8.5. See [`.github/workflows/tests.yml`](./.github/workflows/tests.yml).

## Contact us

We're active right here on GitHub, and you can find us on [Discord](https://discord.gg/sK686yHdaK).
