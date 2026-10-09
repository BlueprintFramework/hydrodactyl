import * as child from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react-swc';
import laravel from 'laravel-vite-plugin';
import million from 'million/compiler';
import { dirname, resolve } from 'pathe';
import { defineConfig } from 'vite';
import manifestSRI from 'vite-plugin-manifest-sri';

import packageJson from './package.json';

function getLaravelAppVersion() {
    try {
        const configPath = path.resolve(__dirname, 'config/app.php');
        const configContent = fs.readFileSync(configPath, 'utf8');

        const versionMatch = configContent.match(/'version'\s*=>\s*'(.*?)'/);

        if (versionMatch?.[1]) {
            return versionMatch[1];
        }

        // Fallback to package.json version if not found in Laravel config
        return packageJson.version;
    } catch (error) {
        console.error('Error reading Laravel config:', error);
        return packageJson.version;
    }
}

const laravelVersion = getLaravelAppVersion();

let branchName: string;
let commitHash: string;

try {
    branchName = child.execSync('git rev-parse --abbrev-ref HEAD').toString().trimEnd();
    commitHash = child.execSync('git rev-parse HEAD').toString().trimEnd();
} catch (error) {
    console.error('Error executing git command:', error);
    branchName = 'unknown';
    commitHash = 'unknown';
}

export default defineConfig({
    build: {
        assetsInlineLimit: 0,
        emptyOutDir: true,

        // default manifest location is in .vite/manifest.json
        // laravel looks in public/build/manifest.json
        manifest: 'manifest.json',

        outDir: 'public/build',

        rolldownOptions: {
            input: [path.resolve('resources/scripts/index.tsx'), path.resolve('resources/scripts/admin/index.tsx')],
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: (moduleId) => {
                                if (!moduleId.includes('node_modules')) {
                                    return null;
                                }

                                // Extract the real package name from either an npm layout
                                // (node_modules/<pkg>) or a pnpm layout
                                // (node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>), including
                                // scoped packages such as @hugeicons/core-free-icons.
                                const match =
                                    /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/.exec(
                                        moduleId,
                                    );

                                return match ? match[1] : null;
                            },
                        },
                    ],
                },
            },
        },
    },

    define: {
        'import.meta.env.VITE_HYDRODACTYL_VERSION': JSON.stringify(laravelVersion),
        'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(commitHash),
        'import.meta.env.VITE_BRANCH_NAME': JSON.stringify(branchName),
        'import.meta.env.VITE_HYDRODACTYL_BUILD_NUMBER': JSON.stringify(packageJson.buildNumber),
        'process.env': {},
        'process.platform': null,
        'process.version': null,
        'process.versions': null,
    },

    plugins: [
        laravel(['resources/scripts/index.tsx', 'resources/scripts/admin/index.tsx']),
        manifestSRI(),
        million.vite({
            auto: {
                threshold: 0.01,
            },
            telemetry: false,
        }),
        react({
            plugins: [
                [
                    '@swc/plugin-styled-components',
                    {
                        pure: true,
                        namespace: 'hydrodactyl',
                    },
                ],
            ],
        }),
    ],

    resolve: {
        dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
        alias: {
            '@': resolve(dirname(fileURLToPath(import.meta.url)), 'resources', 'scripts'),
            '@definitions': resolve(
                dirname(fileURLToPath(import.meta.url)),
                'resources',
                'scripts',
                'api',
                'definitions',
            ),
            '@feature': resolve(
                dirname(fileURLToPath(import.meta.url)),
                'resources',
                'scripts',
                'components',
                'server',
                'features',
            ),
        },
    },

    server: {
        warmup: {
            clientFiles: [
                'resources/scripts/index.tsx',
                'resources/scripts/routers/UnifiedRouter.tsx',
                'resources/scripts/components/dashboard/DashboardContainer.tsx',
            ],
        },
    },
});
