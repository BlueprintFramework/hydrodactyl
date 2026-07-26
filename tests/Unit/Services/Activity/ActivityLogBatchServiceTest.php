<?php

namespace Pterodactyl\Tests\Unit\Services\Activity;

use Ramsey\Uuid\Uuid;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Services\Activity\ActivityLogBatchService;

class ActivityLogBatchServiceTest extends TestCase
{
    private ActivityLogBatchService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->service = app(ActivityLogBatchService::class);
    }

    public function testUuidIsNullBeforeStart()
    {
        $this->assertNull($this->service->uuid());
    }

    public function testStartGeneratesUuid()
    {
        $this->service->start();

        $uuid = $this->service->uuid();
        $this->assertNotNull($uuid);
        $this->assertTrue(Uuid::isValid($uuid));
    }

    public function testEndClearsUuid()
    {
        $this->service->start();
        $this->assertNotNull($this->service->uuid());

        $this->service->end();
        $this->assertNull($this->service->uuid());
    }

    public function testNestedTransactionsShareSameUuid()
    {
        $this->service->start();
        $firstUuid = $this->service->uuid();

        $this->service->start();
        $secondUuid = $this->service->uuid();

        $this->assertSame($firstUuid, $secondUuid);

        $this->service->end();
        $this->assertNotNull($this->service->uuid());

        $this->service->end();
        $this->assertNull($this->service->uuid());
    }

    public function testEndDoesNotGoBelowZero()
    {
        $this->service->end();
        $this->assertNull($this->service->uuid());

        $this->service->end();
        $this->assertNull($this->service->uuid());
    }

    public function testTransactionClosureReceivesUuid()
    {
        $result = $this->service->transaction(function ($uuid) {
            $this->assertNotNull($uuid);
            $this->assertTrue(Uuid::isValid($uuid));

            return 'closure-result';
        });

        $this->assertSame('closure-result', $result);
        $this->assertNull($this->service->uuid());
    }

    public function testMultipleTransactionsGenerateUniqueUuids()
    {
        $uuid1 = null;
        $uuid2 = null;

        $this->service->transaction(function ($uuid) use (&$uuid1) {
            $uuid1 = $uuid;
        });

        $this->service->transaction(function ($uuid) use (&$uuid2) {
            $uuid2 = $uuid;
        });

        $this->assertNotNull($uuid1);
        $this->assertNotNull($uuid2);
        $this->assertNotSame($uuid1, $uuid2);
    }

    public function testNestedTransactionClosuresShareSameUuid()
    {
        $outerUuid = null;
        $innerUuid = null;

        $this->service->transaction(function ($uuid) use (&$outerUuid, &$innerUuid) {
            $outerUuid = $uuid;

            $this->service->transaction(function ($uuid) use (&$innerUuid) {
                $innerUuid = $uuid;
            });
        });

        $this->assertSame($outerUuid, $innerUuid);
    }
}
