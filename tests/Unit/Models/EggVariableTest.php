<?php

namespace Pterodactyl\Tests\Unit\Models;

use Pterodactyl\Tests\TestCase;
use Pterodactyl\Models\EggVariable;

class EggVariableTest extends TestCase
{
    public function testGetRequiredAttributeReturnsTrueWhenRequiredInRules()
    {
        $variable = new EggVariable(['rules' => 'required|string|max:255']);
        $this->assertTrue($variable->getRequiredAttribute());
    }

    public function testGetRequiredAttributeReturnsFalseWhenNotRequired()
    {
        $variable = new EggVariable(['rules' => 'string|max:255']);
        $this->assertFalse($variable->getRequiredAttribute());
    }

    public function testGetRequiredAttributeReturnsFalseWhenEmptyRules()
    {
        $variable = new EggVariable(['rules' => '']);
        $this->assertFalse($variable->getRequiredAttribute());
    }

    public function testReservedEnvNamesContainsServerMemory()
    {
        $reserved = explode(',', EggVariable::RESERVED_ENV_NAMES);
        $this->assertContains('SERVER_MEMORY', $reserved);
    }

    public function testReservedEnvNamesContainsServerIp()
    {
        $reserved = explode(',', EggVariable::RESERVED_ENV_NAMES);
        $this->assertContains('SERVER_IP', $reserved);
    }

    public function testReservedEnvNamesContainsServerPort()
    {
        $reserved = explode(',', EggVariable::RESERVED_ENV_NAMES);
        $this->assertContains('SERVER_PORT', $reserved);
    }
}
