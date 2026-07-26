# Hydrodactyl development tasks
# Run `just` to list available recipes

# Default: list available recipes
default:
    @just --list

# --- Docker Development ---

# Start the full development stack
dev:
    docker compose -f docker-compose.develop.yml up -d

# Rebuild and start the development stack
dev-build:
    docker compose -f docker-compose.develop.yml up -d --build

# Stop the development stack
dev-down:
    docker compose -f docker-compose.develop.yml down

# View logs from all containers
dev-logs:
    docker compose -f docker-compose.develop.yml logs -f

# --- Frontend ---

# Run Biome linter with auto-fix
lint:
    pnpm run lint

# Run Biome format check
check-frontend:
    pnpm run check

# Build frontend assets
build:
    pnpm run build

# --- PHP Quality ---

# Run PHPStan static analysis
phpstan:
    vendor/bin/phpstan analyse

# Fix code style with php-cs-fixer
cs-fix:
    vendor/bin/php-cs-fixer fix

# Check code style without modifying files
cs-check:
    vendor/bin/php-cs-fixer fix --dry-run -v

# --- Testing ---

# Run all tests
test:
    php artisan test

# Run unit tests only
test-unit:
    php artisan test --testsuite=Unit

# Run integration tests only
test-integration:
    php artisan test --testsuite=Integration

# --- Full Quality Pipeline ---

# Run all checks: lint, format, phpstan, and tests
check: lint check-frontend phpstan test

# --- Laravel ---

# Clear caches
clear:
    php artisan cache:clear
    php artisan config:clear
    php artisan route:clear
    php artisan view:clear

# Run database migrations
migrate:
    php artisan migrate

# Seed the database
seed:
    php artisan db:seed

# Generate IDE helper files
ide-helper:
    php artisan ide-helper:models
    php artisan ide-helper:meta
