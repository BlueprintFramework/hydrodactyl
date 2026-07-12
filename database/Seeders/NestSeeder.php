<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Pterodactyl\Models\Nest;
use Pterodactyl\Services\Nests\NestCreationService;

class NestSeeder extends Seeder
{
    private const PTERODACTYL_AUTHOR = 'support@pterodactyl.io';
    private const PHOSPHOR_AUTHOR = 'support@phosphor.host';

    /**
     * NestSeeder constructor.
     */
    public function __construct(
        private NestCreationService $creationService,
    ) {
    }

    /**
     * Run the seeder to add missing nests to the Panel.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    public function run()
    {
        $items = Nest::query()->get()->keyBy('name');

        $this->createMinecraftNest($items->get('Minecraft'));
        $this->createMinecraftBedrockNest($items->get('Minecraft Bedrock'));
        $this->createHytaleNest($items->get('Hytale'));
        $this->createSourceEngineNest($items->get('Source Engine'));
        $this->createVoiceServersNest($items->get('Voice Servers'));
        $this->createRustNest($items->get('Rust'));
        $this->createVintageStoryNest($items->get('Vintage Story'));
    }

    private function resolveNestAuthor(string $nestName): string
    {
        $files = new \DirectoryIterator(database_path('Seeders/eggs/' . kebab_case($nestName)));

        foreach ($files as $file) {
            if (!$file->isFile() || !$file->isReadable()) {
                continue;
            }

            $decoded = json_decode(file_get_contents($file->getRealPath()), true, 512, JSON_THROW_ON_ERROR);
            $author = $decoded['author'] ?? null;

            if (is_string($author) && $author !== '') {
                return $author;
            }
        }

        return self::PTERODACTYL_AUTHOR;
    }

    /**
     * Create the Minecraft nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createMinecraftNest(?Nest $nest = null)
    {
        if (is_null($nest)) {
            $this->creationService->handle([
                'name' => 'Minecraft',
                'description' => 'Minecraft - the classic game from Mojang. With support for Vanilla MC, Spigot, and many others!',
            ], self::PTERODACTYL_AUTHOR);
        }
    }

    /**
     * Create the Minecraft Bedrock nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createMinecraftBedrockNest(?Nest $nest = null)
    {
        if (is_null($nest)) {
            $this->creationService->handle([
                'name' => 'Minecraft Bedrock',
                'description' => 'The Bedrock edition of Minecraft. Comes with support for Vanilla, Endstone, Waterdog, and many others!',
            ], self::PHOSPHOR_AUTHOR);
        }
    }

    /**
     * Create the Hytale nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createHytaleNest(?Nest $nest = null)
    {
        if (is_null($nest)) {
            $this->creationService->handle([
                'name' => 'Hytale',
                'description' => 'Hytale - A new sandbox game from Hypixel Studios.',
            ], self::PTERODACTYL_AUTHOR);
        }
    }

    /**
     * Create the Source Engine Games nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createSourceEngineNest(?Nest $nest = null)
    {
        if (is_null($nest)) {
            $this->creationService->handle([
                'name' => 'Source Engine',
                'description' => 'Includes support for most Source Dedicated Server games.',
            ], self::PTERODACTYL_AUTHOR);
        }
    }

    /**
     * Create the Voice Servers nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createVoiceServersNest(?Nest $nest = null)
    {
        if (is_null($nest)) {
            $this->creationService->handle([
                'name' => 'Voice Servers',
                'description' => 'Voice servers such as Mumble and Teamspeak 3.',
            ], self::PTERODACTYL_AUTHOR);
        }
    }

    /**
     * Create the Rust nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createRustNest(?Nest $nest = null)
    {
        if (is_null($nest)) {
            $this->creationService->handle([
                'name' => 'Rust',
                'description' => 'Rust - A game where you must fight to survive.',
            ], self::PTERODACTYL_AUTHOR);
        }
    }

     /**
     * Create the Vintage Story nest to be used later on.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    private function createVintageStoryNest(?Nest $nest = null)
    {
        if (is_null($nest)) {
            $this->creationService->handle([
                'name' => 'Vintage Story',
                'description' => 'Vintage Story - An uncompromising wilderness survival sandbox game.',
            ], self::PTERODACTYL_AUTHOR);
        }
    }
}
