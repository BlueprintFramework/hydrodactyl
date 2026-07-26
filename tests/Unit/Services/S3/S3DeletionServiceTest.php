<?php

namespace Pterodactyl\Tests\Unit\Services\S3;

use Mockery\MockInterface;
use Pterodactyl\Models\S3;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Services\S3\S3DeletionService;
use Illuminate\Contracts\Translation\Translator;
use Pterodactyl\Contracts\Repository\S3RepositoryInterface;
use Pterodactyl\Contracts\Repository\ServerRepositoryInterface;

class S3DeletionServiceTest extends TestCase
{
    private MockInterface $repository;
    private MockInterface $serverRepository;
    private MockInterface $translator;
    private S3DeletionService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->repository = $this->mock(S3RepositoryInterface::class);
        $this->serverRepository = $this->mock(ServerRepositoryInterface::class);
        $this->translator = $this->mock(Translator::class);

        $this->service = new S3DeletionService($this->repository, $this->serverRepository, $this->translator);
    }

    public function testS3NotUsedByAnyNodeCanBeDeleted()
    {
        $s3 = \Mockery::mock(S3::class)->makePartial();
        $s3->id = 1;

        $this->repository->shouldReceive('find')
            ->with(1)
            ->andReturn($s3);

        $this->serverRepository->shouldReceive('findCountWhere')
            ->with([['s3_id', '=', 1]])
            ->andReturn(0);

        $this->repository->shouldReceive('delete')
            ->with(1)
            ->andReturn(true);

        $result = $this->service->handle(1);

        $this->assertTrue($result);
    }

    public function testS3InUseCannotBeDeleted()
    {
        $s3 = \Mockery::mock(S3::class)->makePartial();
        $s3->id = 2;

        $this->repository->shouldReceive('find')
            ->with(2)
            ->andReturn($s3);

        $this->serverRepository->shouldReceive('findCountWhere')
            ->with([['s3_id', '=', 2]])
            ->andReturn(1);

        $this->translator->shouldReceive('get')
            ->once()
            ->andReturn('Cannot delete: in use by servers');

        $this->expectException(DisplayException::class);

        $this->service->handle(2);
    }
}
