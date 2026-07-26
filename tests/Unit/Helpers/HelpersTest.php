<?php

namespace Pterodactyl\Tests\Unit\Helpers;

use Pterodactyl\Tests\TestCase;

class HelpersTest extends TestCase
{
    /**
     * Test the humanizeSize helper converts bytes to human readable format.
     */
    public function testHumanizeSizeConvertsBytesCorrectly()
    {
        $this->assertSame('0 B', humanizeSize(0));
        $this->assertSame('1 B', humanizeSize(1));
        $this->assertSame('512 B', humanizeSize(512));
        $this->assertSame('1 KiB', humanizeSize(1024));
        $this->assertSame('1.5 KiB', humanizeSize(1536));
        $this->assertSame('1 MiB', humanizeSize(1048576));
        $this->assertSame('1 GiB', humanizeSize(1073741824));
    }

    /**
     * Test that humanizeSize handles float input.
     */
    public function testHumanizeSizeHandlesFloatInput()
    {
        $result = humanizeSize(1024.5);
        $this->assertStringContainsString('KiB', $result);
    }

    /**
     * Test the object_get_strict helper with nested objects.
     */
    public function testObjectGetStrictReturnsNestedValue()
    {
        $inner = new \stdClass();
        $inner->value = 'test';

        $outer = new \stdClass();
        $outer->nested = $inner;

        $this->assertSame('test', object_get_strict($outer, 'nested.value'));
    }

    /**
     * Test that object_get_strict returns the original object when key is null.
     */
    public function testObjectGetStrictReturnsObjectWithNullKey()
    {
        $object = new \stdClass();
        $object->name = 'test';

        $this->assertSame($object, object_get_strict($object, null));
    }

    /**
     * Test that object_get_strict returns the original object when key is empty.
     */
    public function testObjectGetStrictReturnsObjectWithEmptyKey()
    {
        $object = new \stdClass();
        $object->name = 'test';

        $this->assertSame($object, object_get_strict($object, ''));
    }

    /**
     * Test that object_get_strict returns null for non-existent nested key.
     */
    public function testObjectGetStrictReturnsNullForMissingKey()
    {
        $object = new \stdClass();

        $this->assertNull(object_get_strict($object, 'nonexistent'));
    }

    /**
     * Test that object_get_strict returns default value for non-existent key.
     */
    public function testObjectGetStrictReturnsDefaultForMissingKey()
    {
        $object = new \stdClass();

        $this->assertSame('default', object_get_strict($object, 'nonexistent', 'default'));
    }

    /**
     * Test that object_get_strict returns null for nested non-existent key.
     */
    public function testObjectGetStrictReturnsNullForNestedMissingKey()
    {
        $inner = new \stdClass();
        $outer = new \stdClass();
        $outer->nested = $inner;

        $this->assertNull(object_get_strict($outer, 'nested.nonexistent'));
    }

    /**
     * Test that object_get_strict returns default for nested non-existent key.
     */
    public function testObjectGetStrictReturnsDefaultForNestedMissingKey()
    {
        $inner = new \stdClass();
        $outer = new \stdClass();
        $outer->nested = $inner;

        $this->assertSame('fallback', object_get_strict($outer, 'nested.nonexistent', 'fallback'));
    }
}
