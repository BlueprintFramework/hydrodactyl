<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Pterodactyl\Services\Nests\NestCreationService;
use Pterodactyl\Contracts\Repository\NestRepositoryInterface;

class NestSeeder extends Seeder
{
    /**
     * @var NestCreationService
     */
    private $creationService;

    /**
     * @var NestRepositoryInterface
     */
    private $repository;

    /**
     * Maps nest display name → source PNG filename in public/assets/images/.
     */
    private array $icons = [
        'Minecraft'        => 'minecraft.png',
        'Minecraft (itzg)' => 'minecraft.png',
        'Hytale'           => 'hytale.png',
        'Source Engine'    => 'sourceengine.png',
        'Voice Servers'    => 'teamspeak.png',
        'Rust'             => 'rust.png',
        'Vintage Story'    => 'vintage_story.png',
    ];

    /**
     * NestSeeder constructor.
     */
    public function __construct(
        NestCreationService $creationService,
        NestRepositoryInterface $repository,
    ) {
        $this->creationService = $creationService;
        $this->repository = $repository;
    }

    /**
     * Run the seeder to add missing nests to the Panel.
     *
     * Requires `php artisan storage:link` for icons to be publicly accessible.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    public function run(): void
    {
        $items = $this->repository->findWhere([
            'author' => 'support@pterodactyl.io',
        ])->keyBy('name')->toArray();

        $this->createMinecraftNest(array_get($items, 'Minecraft'));
        $this->createMinecraftIzzgNest(array_get($items, 'Minecraft (itzg)'));
        $this->createHytaleNest(array_get($items, 'Hytale'));
        $this->createSourceEngineNest(array_get($items, 'Source Engine'));
        $this->createVoiceServersNest(array_get($items, 'Voice Servers'));
        $this->createRustNest(array_get($items, 'Rust'));
        $this->createVintageStoryNest(array_get($items, 'Vintage Story'));
    }

    /**
     * Copy a nest icon from public/assets/images/ into storage/app/public/nests/.
     *
     * Returns the relative storage path (e.g. 'nests/minecraft.png') on success,
     * or null if the nest name is not mapped or the source file does not exist.
     */
    private function copyIcon(string $nestName): ?string
    {
        $src = $this->icons[$nestName] ?? null;
        if ($src === null) {
            return null;
        }

        $sourcePath = public_path('assets/images/' . $src);
        if (!file_exists($sourcePath)) {
            return null;
        }

        Storage::disk('public')->makeDirectory('nests');
        copy($sourcePath, Storage::disk('public')->path('nests/' . $src));

        return 'nests/' . $src;
    }

    /**
     * Create the Minecraft nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createMinecraftNest(?array $nest = null): void
    {
        $icon = $this->copyIcon('Minecraft');

        if (is_null($nest)) {
            $this->creationService->handle([
                'name'        => 'Minecraft',
                'description' => 'Minecraft - the classic game from Mojang. With support for Vanilla MC, Spigot, and many others!',
                'icon'        => $icon,
            ], 'support@pterodactyl.io');
        } elseif ($nest['icon'] === null && $icon !== null) {
            $this->repository->update(['icon' => $icon], $nest['id']);
        }
    }

    /**
     * Create the Minecraft (itzg) nest for itzg-powered Docker images.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createMinecraftIzzgNest(?array $nest = null): void
    {
        $icon = $this->copyIcon('Minecraft (itzg)');

        if (is_null($nest)) {
            $this->creationService->handle([
                'name'        => 'Minecraft (itzg)',
                'description' => 'Minecraft servers powered by itzg Docker images, with extensive configuration options.',
                'icon'        => $icon,
            ], 'support@pterodactyl.io');
        } elseif ($nest['icon'] === null && $icon !== null) {
            $this->repository->update(['icon' => $icon], $nest['id']);
        }
    }

    /**
     * Create the Hytale nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createHytaleNest(?array $nest = null): void
    {
        $icon = $this->copyIcon('Hytale');

        if (is_null($nest)) {
            $this->creationService->handle([
                'name'        => 'Hytale',
                'description' => 'Hytale - A new sandbox game from Hypixel Studios.',
                'icon'        => $icon,
            ], 'support@pterodactyl.io');
        } elseif ($nest['icon'] === null && $icon !== null) {
            $this->repository->update(['icon' => $icon], $nest['id']);
        }
    }

    /**
     * Create the Source Engine Games nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createSourceEngineNest(?array $nest = null): void
    {
        $icon = $this->copyIcon('Source Engine');

        if (is_null($nest)) {
            $this->creationService->handle([
                'name'        => 'Source Engine',
                'description' => 'Includes support for most Source Dedicated Server games.',
                'icon'        => $icon,
            ], 'support@pterodactyl.io');
        } elseif ($nest['icon'] === null && $icon !== null) {
            $this->repository->update(['icon' => $icon], $nest['id']);
        }
    }

    /**
     * Create the Voice Servers nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createVoiceServersNest(?array $nest = null): void
    {
        $icon = $this->copyIcon('Voice Servers');

        if (is_null($nest)) {
            $this->creationService->handle([
                'name'        => 'Voice Servers',
                'description' => 'Voice servers such as Mumble and Teamspeak 3.',
                'icon'        => $icon,
            ], 'support@pterodactyl.io');
        } elseif ($nest['icon'] === null && $icon !== null) {
            $this->repository->update(['icon' => $icon], $nest['id']);
        }
    }

    /**
     * Create the Rust nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createRustNest(?array $nest = null): void
    {
        $icon = $this->copyIcon('Rust');

        if (is_null($nest)) {
            $this->creationService->handle([
                'name'        => 'Rust',
                'description' => 'Rust - A game where you must fight to survive.',
                'icon'        => $icon,
            ], 'support@pterodactyl.io');
        } elseif ($nest['icon'] === null && $icon !== null) {
            $this->repository->update(['icon' => $icon], $nest['id']);
        }
    }

    /**
     * Create the Vintage Story nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createVintageStoryNest(?array $nest = null): void
    {
        $icon = $this->copyIcon('Vintage Story');

        if (is_null($nest)) {
            $this->creationService->handle([
                'name'        => 'Vintage Story',
                'description' => 'Vintage Story - An uncompromising wilderness survival sandbox game.',
                'icon'        => $icon,
            ], 'support@pterodactyl.io');
        } elseif ($nest['icon'] === null && $icon !== null) {
            $this->repository->update(['icon' => $icon], $nest['id']);
        }
    }
}
