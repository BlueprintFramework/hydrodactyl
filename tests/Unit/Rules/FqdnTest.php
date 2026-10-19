<?php

namespace Pterodactyl\Tests\Unit\Rules;

use Pterodactyl\Rules\Fqdn;
use Pterodactyl\Tests\TestCase;

class FqdnTest extends TestCase
{
    private Fqdn $rule;

    public function setUp(): void
    {
        parent::setUp();

        $this->rule = new Fqdn();
    }

    /**
     * Test that valid IP addresses pass validation.
     */
    public function testValidIpAddressPasses()
    {
        $this->assertTrue($this->rule->passes('attribute', '127.0.0.1'));
        $this->assertTrue($this->rule->passes('attribute', '192.168.1.1'));
        $this->assertTrue($this->rule->passes('attribute', '8.8.8.8'));
    }

    /**
     * Test that an IP address with HTTPS scheme fails.
     */
    public function testIpAddressFailsWithHttpsScheme()
    {
        $rule = Fqdn::make('scheme');
        $rule->setData(['scheme' => 'https']);

        $this->assertFalse($rule->passes('attribute', '127.0.0.1'));
    }

    /**
     * Test that an IP address with HTTP scheme passes.
     */
    public function testIpAddressPassesWithHttpScheme()
    {
        $rule = Fqdn::make('scheme');
        $rule->setData(['scheme' => 'http']);

        $this->assertTrue($rule->passes('attribute', '127.0.0.1'));
    }

    /**
     * Test that a locally resolvable domain passes.
     *
     * External DNS availability is not a prerequisite for running the test suite.
     */
    public function testLocallyResolvableDomainPasses()
    {
        $this->assertTrue($this->rule->passes('attribute', 'localhost'));
    }

    /**
     * Test that the message method returns the expected value.
     */
    public function testMessageReturnsEmptyStringByDefault()
    {
        $this->assertSame('', $this->rule->message());
    }

    /**
     * Test that the message returns the error message after a failed validation.
     */
    public function testMessageReturnsErrorAfterIpWithHttpsFails()
    {
        $rule = Fqdn::make('scheme');
        $rule->setData(['scheme' => 'https']);

        $rule->passes('attribute', '127.0.0.1');

        $this->assertNotEmpty($rule->message());
        $this->assertStringContainsString(':attribute', $rule->message());
        $this->assertStringContainsString('IP address', $rule->message());
    }

    /**
     * Test that the make method returns an instance of Fqdn.
     */
    public function testMakeReturnsFqdnInstance()
    {
        $this->assertInstanceOf(Fqdn::class, Fqdn::make());
        $this->assertInstanceOf(Fqdn::class, Fqdn::make('scheme'));
    }
}
