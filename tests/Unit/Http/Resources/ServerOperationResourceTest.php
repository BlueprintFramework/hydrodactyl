<?php

namespace Pterodactyl\Tests\Unit\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Models\ServerOperation;
use Pterodactyl\Http\Resources\ServerOperationResource;

class ServerOperationResourceTest extends TestCase
{
    public function testToArrayReturnsExpectedStructureForPendingOperation()
    {
        $now = Carbon::now()->startOfSecond();
        $operation = new ServerOperation();
        $operation->operation_id = 'op-123';
        $operation->type = 'egg_change';
        $operation->status = 'pending';
        $operation->message = 'Operation pending...';
        $operation->parameters = ['egg_id' => 5];
        $operation->created_at = $now;
        $operation->updated_at = $now;
        $operation->started_at = null;

        $resource = new ServerOperationResource($operation);
        $result = $resource->toArray(\Mockery::mock(Request::class));

        $this->assertSame('op-123', $result['operation_id']);
        $this->assertSame('egg_change', $result['type']);
        $this->assertSame('pending', $result['status']);
        $this->assertSame('Operation pending...', $result['message']);
        $this->assertSame($now->toISOString(), $result['created_at']);
        $this->assertSame($now->toISOString(), $result['updated_at']);
        $this->assertNull($result['started_at']);
        $this->assertSame(['egg_id' => 5], $result['parameters']);
        $this->assertTrue($result['meta']['is_active']);
        $this->assertFalse($result['meta']['is_completed']);
        $this->assertFalse($result['meta']['has_failed']);
        $this->assertFalse($result['meta']['has_timed_out']);
        $this->assertTrue($result['meta']['can_be_cancelled']);
    }

    public function testToArrayReturnsExpectedStructureForCompletedOperation()
    {
        $now = Carbon::now()->startOfSecond();
        $started = Carbon::now()->startOfSecond()->subMinutes(5);
        $operation = new ServerOperation();
        $operation->operation_id = 'op-456';
        $operation->type = 'reinstall';
        $operation->status = 'completed';
        $operation->message = 'Done';
        $operation->parameters = null;
        $operation->created_at = $now;
        $operation->updated_at = $now;
        $operation->started_at = $started;

        $resource = new ServerOperationResource($operation);
        $result = $resource->toArray(\Mockery::mock(Request::class));

        $this->assertSame('op-456', $result['operation_id']);
        $this->assertSame('reinstall', $result['type']);
        $this->assertSame('completed', $result['status']);
        $this->assertSame($started->toISOString(), $result['started_at']);
        $this->assertFalse($result['meta']['is_active']);
        $this->assertTrue($result['meta']['is_completed']);
        $this->assertFalse($result['meta']['has_failed']);
        $this->assertFalse($result['meta']['can_be_cancelled']);
    }

    public function testToArrayForFailedOperation()
    {
        $now = Carbon::now()->startOfSecond();
        $operation = new ServerOperation();
        $operation->operation_id = 'op-789';
        $operation->type = 'egg_change';
        $operation->status = 'failed';
        $operation->message = 'Something went wrong';
        $operation->parameters = [];
        $operation->created_at = $now;
        $operation->updated_at = $now;
        $operation->started_at = $now;

        $resource = new ServerOperationResource($operation);
        $result = $resource->toArray(\Mockery::mock(Request::class));

        $this->assertSame('failed', $result['status']);
        $this->assertFalse($result['meta']['is_active']);
        $this->assertFalse($result['meta']['is_completed']);
        $this->assertTrue($result['meta']['has_failed']);
        $this->assertFalse($result['meta']['can_be_cancelled']);
    }

    public function testToArrayForRunningOperation()
    {
        $now = Carbon::now()->startOfSecond();
        $operation = new ServerOperation();
        $operation->operation_id = 'op-101';
        $operation->type = 'backup_restore';
        $operation->status = 'running';
        $operation->message = 'Running...';
        $operation->parameters = null;
        $operation->created_at = $now;
        $operation->updated_at = $now;
        $operation->started_at = $now;

        $resource = new ServerOperationResource($operation);
        $result = $resource->toArray(\Mockery::mock(Request::class));

        $this->assertSame('running', $result['status']);
        $this->assertTrue($result['meta']['is_active']);
        $this->assertFalse($result['meta']['has_timed_out']);
        $this->assertTrue($result['meta']['can_be_cancelled']);
    }
}
