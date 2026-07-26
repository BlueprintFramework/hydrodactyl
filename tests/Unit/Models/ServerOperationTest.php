<?php

namespace Pterodactyl\Tests\Unit\Models;

use Carbon\Carbon;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Models\ServerOperation;

class ServerOperationTest extends TestCase
{
    public function testIsActiveReturnsTrueForPending()
    {
        $operation = new ServerOperation(['status' => ServerOperation::STATUS_PENDING]);
        $this->assertTrue($operation->isActive());
    }

    public function testIsActiveReturnsTrueForRunning()
    {
        $operation = new ServerOperation(['status' => ServerOperation::STATUS_RUNNING]);
        $this->assertTrue($operation->isActive());
    }

    public function testIsActiveReturnsFalseForCompleted()
    {
        $operation = new ServerOperation(['status' => ServerOperation::STATUS_COMPLETED]);
        $this->assertFalse($operation->isActive());
    }

    public function testIsActiveReturnsFalseForFailed()
    {
        $operation = new ServerOperation(['status' => ServerOperation::STATUS_FAILED]);
        $this->assertFalse($operation->isActive());
    }

    public function testIsActiveReturnsFalseForCancelled()
    {
        $operation = new ServerOperation(['status' => ServerOperation::STATUS_CANCELLED]);
        $this->assertFalse($operation->isActive());
    }

    public function testIsCompletedReturnsTrueWhenCompleted()
    {
        $operation = new ServerOperation(['status' => ServerOperation::STATUS_COMPLETED]);
        $this->assertTrue($operation->isCompleted());
    }

    public function testIsCompletedReturnsFalseWhenNotCompleted()
    {
        $operation = new ServerOperation(['status' => ServerOperation::STATUS_RUNNING]);
        $this->assertFalse($operation->isCompleted());
    }

    public function testHasFailedReturnsTrueWhenFailed()
    {
        $operation = new ServerOperation(['status' => ServerOperation::STATUS_FAILED]);
        $this->assertTrue($operation->hasFailed());
    }

    public function testHasFailedReturnsFalseWhenNotFailed()
    {
        $operation = new ServerOperation(['status' => ServerOperation::STATUS_RUNNING]);
        $this->assertFalse($operation->hasFailed());
    }

    public function testHasTimedOutReturnsFalseWhenNotActive()
    {
        Carbon::setTestNow(Carbon::now());

        $operation = new ServerOperation([
            'status' => ServerOperation::STATUS_COMPLETED,
            'started_at' => Carbon::now()->subHours(2),
        ]);

        $this->assertFalse($operation->hasTimedOut());
    }

    public function testHasTimedOutReturnsFalseWhenNotStarted()
    {
        Carbon::setTestNow(Carbon::now());

        $operation = new ServerOperation([
            'status' => ServerOperation::STATUS_RUNNING,
            'started_at' => null,
        ]);

        $this->assertFalse($operation->hasTimedOut());
    }

    public function testHasTimedOutReturnsFalseWhenWithinThreshold()
    {
        Carbon::setTestNow(Carbon::now());

        $operation = new ServerOperation([
            'status' => ServerOperation::STATUS_RUNNING,
            'started_at' => Carbon::now()->subMinutes(15),
        ]);

        $this->assertFalse($operation->hasTimedOut());
    }

    public function testHasTimedOutReturnsTrueWhenExceedsThreshold()
    {
        Carbon::setTestNow(Carbon::now());

        $operation = new ServerOperation([
            'status' => ServerOperation::STATUS_RUNNING,
            'started_at' => Carbon::now()->subMinutes(45),
        ]);

        $this->assertTrue($operation->hasTimedOut());
    }

    public function testHasTimedOutUsesCustomTimeout()
    {
        Carbon::setTestNow(Carbon::now());

        $operation = new ServerOperation([
            'status' => ServerOperation::STATUS_RUNNING,
            'started_at' => Carbon::now()->subMinutes(15),
        ]);

        $this->assertTrue($operation->hasTimedOut(10));
        $this->assertFalse($operation->hasTimedOut(20));
    }

    public function testGetDurationInSecondsReturnsNullWhenNotStarted()
    {
        Carbon::setTestNow(Carbon::now());

        $operation = new ServerOperation([
            'status' => ServerOperation::STATUS_PENDING,
            'started_at' => null,
        ]);

        $this->assertNull($operation->getDurationInSeconds());
    }

    public function testGetDurationInSecondsReturnsElapsedTime()
    {
        Carbon::setTestNow(Carbon::now());

        $operation = new ServerOperation([
            'status' => ServerOperation::STATUS_RUNNING,
            'started_at' => Carbon::now()->subMinutes(5),
        ]);

        $this->assertSame(300, $operation->getDurationInSeconds());
    }
}
