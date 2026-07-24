# Hydrodactyl — development task runner
# https://just.systems

set shell := ["bash", "-euo", "pipefail", "-c"]
set dotenv-load

# ──────────────────────── frontend ────────────────────────

# Start Vite dev server
dev:
    pnpm dev

# Production build
build:
    pnpm build

# Biome lint (auto-fix)
lint:
    pnpm lint

# Biome check (no auto-fix)
check:
    pnpm check

# Turbo build (full pipeline)
ship:
    pnpm ship

# ──────────────────────── backend ────────────────────────

# Run a Laravel artisan command
artisan *args:
    php artisan {{ args }}

# Run all PHPUnit tests
test:
    php artisan test

# Run Unit test suite
test-unit:
    php artisan test --testsuite=Unit

# Run Integration test suite
test-integration:
    php artisan test --testsuite=Integration

# PHPStan static analysis
analyse:
    php artisan phpstan analyse

# PHP CS Fixer (auto-fix)
cs-fix:
    php vendor/bin/php-cs-fixer fix

# PHP CS Fixer (dry-run)
cs-dry:
    php vendor/bin/php-cs-fixer fix --dry-run --diff

# ──────────────────────── install & setup ────────────────────────

# Install all dependencies (composer + pnpm)
install:
    composer install
    pnpm install

# Run dev setup script
dev-setup:
    pnpm dev:setup

# ──────────────────────── database ────────────────────────

# Run migrations
migrate:
    php artisan migrate

# Fresh migrate + seed
fresh:
    php artisan migrate:fresh --seed

# Open Tinker REPL
tinker:
    php artisan tinker

# ──────────────────────── cache & optimization ────────────────────────

# Clear all caches
cache-clear:
    php artisan cache:clear
    php artisan config:clear
    php artisan route:clear
    php artisan view:clear
    php artisan event:clear

# Rebuild caches
cache-build:
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan event:cache

# ──────────────────────── docker ────────────────────────

# Start all services in detached mode
up:
    docker compose up -d

# Stop all services
down:
    docker compose down

# Restart all services
restart:
    docker compose restart

# Tail logs
logs *services:
    docker compose logs -f {{ services }}

# Shell into the panel container
shell:
    docker compose exec panel sh

# MariaDB shell
db-shell:
    docker compose exec database mariadb -u pterodactyl -ppassword panel

# Rebuild and restart the panel
rebuild:
    docker compose build panel
    docker compose up -d panel

# ──────────────────────── utilities ────────────────────────

# Generate IDE helper files
ide-helper:
    php artisan ide-helper:generate
    php artisan ide-helper:models
    php artisan ide-helper:meta

# Link storage to public
storage-link:
    php artisan storage:link

# Show project info
info:
    @echo "Node: $(node --version)"
    @echo "pnpm: $(pnpm --version)"
    @echo "PHP: $(php --version | head -1)"
    @echo "Composer: $(composer --version)"

# Default recipe — list available commands
default:
    @just --list
