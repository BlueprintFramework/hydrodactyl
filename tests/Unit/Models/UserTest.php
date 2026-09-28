<?php

namespace Pterodactyl\Tests\Unit\Models;

use Pterodactyl\Models\User;
use Pterodactyl\Tests\TestCase;

class UserTest extends TestCase
{
    public function testPreferredLocaleReturnsTheUserLanguage()
    {
        config(['app.locale' => 'en-US']);

        $user = User::factory()->make(['language' => 'es-ES']);

        $this->assertSame('es-ES', $user->preferredLocale());
    }

    public function testPreferredLocaleFallsBackToThePanelDefault()
    {
        config(['app.locale' => 'es-ES']);

        $user = User::factory()->make(['language' => '']);

        $this->assertSame('es-ES', $user->preferredLocale());
    }
}
