import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'pathe';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(dirname(fileURLToPath(import.meta.url)), 'resources', 'scripts'),
            '@lang': resolve(dirname(fileURLToPath(import.meta.url)), 'resources', 'lang'),
        },
    },
    test: {
        globals: true,
        include: ['resources/scripts/**/*.spec.ts'],
    },
});
