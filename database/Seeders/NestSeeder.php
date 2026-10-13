<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
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
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    public function run()
    {
        $items = $this->repository->findWhere([
            'author' => 'support@pterodactyl.io',
        ])->keyBy('name')->toArray();

        $this->createMinecraftNest(array_get($items, 'Minecraft'));
        $this->createHytaleNest(array_get($items, 'Hytale'));
        $this->createSourceEngineNest(array_get($items, 'Source Engine'));
        $this->createVoiceServersNest(array_get($items, 'Voice Servers'));
        $this->createRustNest(array_get($items, 'Rust'));
        $this->createVintageStoryNest(array_get($items, 'Vintage Story'));
    }

    /**
     * Create the Minecraft nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createMinecraftNest(?array $nest = null)
    {
        if (is_null($nest)) {
            $this->creationService->handle([
                'name' => 'Minecraft',
                'description' => __('command/messages.seeders.nest_minecraft_description'),
            ], 'support@pterodactyl.io');
        }
    }

    /**
     * Create the Hytale nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createHytaleNest(?array $nest = null)
    {
        if (is_null($nest)) {
            $this->creationService->handle([
                'name' => 'Hytale',
                'description' => __('command/messages.seeders.nest_hytale_description'),
            ], 'support@pterodactyl.io');
        }
    }

    /**
     * Create the Source Engine Games nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createSourceEngineNest(?array $nest = null)
    {
        if (is_null($nest)) {
            $this->creationService->handle([
                'name' => 'Source Engine',
                'description' => __('command/messages.seeders.nest_source_engine_description'),
            ], 'support@pterodactyl.io');
        }
    }

    /**
     * Create the Voice Servers nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createVoiceServersNest(?array $nest = null)
    {
        if (is_null($nest)) {
            $this->creationService->handle([
                'name' => 'Voice Servers',
                'description' => __('command/messages.seeders.nest_voice_servers_description'),
            ], 'support@pterodactyl.io');
        }
    }

    /**
     * Create the Rust nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createRustNest(?array $nest = null)
    {
        if (is_null($nest)) {
            $this->creationService->handle([
                'name' => 'Rust',
                'description' => __('command/messages.seeders.nest_rust_description'),
            ], 'support@pterodactyl.io');
        }
    }

     /**
     * Create the Vintage Story nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createVintageStoryNest(?array $nest = null)
    {
        if (is_null($nest)) {
            $this->creationService->handle([
                'name' => 'Vintage Story',
                'description' => __('command/messages.seeders.nest_vintage_story_description'),
            ], 'support@pterodactyl.io');
        }
    }

}
