<?php

namespace Pterodactyl\Tests\Unit\Helpers;

use Carbon\Carbon;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Helpers\Utilities;

class UtilitiesTest extends TestCase
{
    public function testRandomStringWithSpecialCharacters()
    {
        $result = Utilities::randomStringWithSpecialCharacters();

        $this->assertIsString($result);
        $this->assertSame(16, strlen($result));
    }

    public function testRandomStringWithSpecialCharactersIsRandom()
    {
        $first = Utilities::randomStringWithSpecialCharacters();
        $second = Utilities::randomStringWithSpecialCharacters();

        $this->assertNotSame($first, $second);
    }

    public function testRandomStringWithCustomLength()
    {
        $result = Utilities::randomStringWithSpecialCharacters(32);

        $this->assertSame(32, strlen($result));
    }

    public function testGetScheduleNextRunDateReturnsCarbonInstance()
    {
        $result = Utilities::getScheduleNextRunDate('*', '*', '*', '*', '*');

        $this->assertInstanceOf(Carbon::class, $result);
    }

    public function testGetScheduleNextRunDateReturnsFutureDate()
    {
        $now = Carbon::now();
        $result = Utilities::getScheduleNextRunDate('*/5', '*', '*', '*', '*');

        $this->assertGreaterThan($now, $result);
    }

    public function testGetScheduleNextRunDateForHourlyCron()
    {
        $result = Utilities::getScheduleNextRunDate('0', '*', '*', '*', '*');

        $this->assertSame(0, (int) $result->format('i'));
    }

    public function testCheckedReturnsCheckedWhenDefaultIsTrue()
    {
        $result = Utilities::checked('test_field', true);
        $this->assertSame('checked', $result);
    }

    public function testCheckedReturnsEmptyStringWhenDefaultIsFalse()
    {
        $result = Utilities::checked('test_field', false);
        $this->assertSame('', $result);
    }

    public function testCheckedWithTruthyDefault()
    {
        $result = Utilities::checked('test_field', 'yes');
        $this->assertSame('checked', $result);
    }

    public function testCheckedWithNumericDefault()
    {
        $result = Utilities::checked('test_field', 1);
        $this->assertSame('checked', $result);
    }
}
