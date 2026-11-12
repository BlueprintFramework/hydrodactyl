<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers\Calagopus;

use Carbon\CarbonImmutable;
use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Enums\Daemon\JwtScope;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Services\Nodes\NodeJWTService;
use Pterodactyl\Services\Files\FileBlockService;
use Pterodactyl\Repositories\Calagopus\DaemonFileRepository;
use Pterodactyl\Transformers\Api\Client\FileObjectTransformer;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Controllers\Api\Client\Servers\Concerns\EnforcesFileBlocks;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\CopyFileRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\PullFileRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\ListFilesRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\ChmodFilesRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\DeleteFileRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\RenameFileRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\CreateFolderRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\CompressFilesRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\DecompressFilesRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\GetFileContentsRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\WriteFileContentRequest;

class FileController extends ClientApiController
{
    use EnforcesFileBlocks;

    /**
     * FileController constructor.
     */
    public function __construct(
        private NodeJWTService $jwtService,
        private DaemonFileRepository $fileRepository,
        private FileBlockService $fileBlockService,
    ) {
        parent::__construct();
    }

    protected function getFileBlockService(): FileBlockService
    {
        return $this->fileBlockService;
    }

    /**
     * List files in directory
     *
     * @throws \Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException
     */
    public function directory(ListFilesRequest $request, Server $server): array
    {
        $directory = $request->get('directory') ?? '/';
        $this->assertPathNotBlocked($server, $request->user(), $directory);

        $contents = $this->fileRepository
            ->setServer($server)
            ->getDirectory($directory);

        $contents = $this->fileBlockService->filterListing(
            $server,
            $request->user(),
            $directory,
            $contents
        );

        return $this->fractal->collection($contents)
            ->transformWith($this->getTransformer(FileObjectTransformer::class))
            ->toArray();
    }

    /**
     * Get file contents
     *
     * @throws \Throwable
     */
    public function contents(GetFileContentsRequest $request, Server $server): Response
    {
        $this->assertPathNotBlocked($server, $request->user(), $request->get('file'));

        $response = $this->fileRepository->setServer($server)->getContent(
            $request->get('file'),
            config('pterodactyl.files.max_edit_size')
        );

        Activity::event('server:file.read')->property('file', $request->get('file'))->log();

        return new Response($response, Response::HTTP_OK, ['Content-Type' => 'text/plain']);
    }

    /**
     * Download file
     *
     * @throws \Throwable
     */
    public function download(GetFileContentsRequest $request, Server $server): array
    {
        $this->assertPathNotBlocked($server, $request->user(), $request->get('file'));

        $token = $this->jwtService
            ->setExpiresAt(CarbonImmutable::now()->addMinutes(15))
            ->setUser($request->user())
            ->setClaims([
                'file_path' => rawurldecode($request->get('file')),
                'server_uuid' => $server->uuid,
            ])
            ->setScopes(JwtScope::FileDownload)
            ->handle($server->node, $request->user()->id . $server->uuid);

        Activity::event('server:file.download')->property('file', $request->get('file'))->log();

        return [
            'object' => 'signed_url',
            'attributes' => [
                'url' => sprintf(
                    '%s/download/file?token=%s',
                    $server->node->getBrowserConnectionAddress(),
                    $token->toString()
                ),
            ],
        ];
    }

    /**
     * Write file contents
     *
     * @throws \Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException
     */
    public function write(WriteFileContentRequest $request, Server $server): JsonResponse
    {
        $this->assertPathNotBlocked($server, $request->user(), $request->get('file'));

        $this->fileRepository->setServer($server)->putContent($request->get('file'), $request->getContent());

        Activity::event('server:file.write')->property('file', $request->get('file'))->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Create folder
     *
     * @throws \Throwable
     */
    public function create(CreateFolderRequest $request, Server $server): JsonResponse
    {
        $root = $request->input('root', '/');
        $path = $this->fileBlockService->join($root, $request->input('name'));
        $this->assertPathNotBlocked($server, $request->user(), $path);

        $this->fileRepository
            ->setServer($server)
            ->createDirectory($request->input('name'), $root);

        Activity::event('server:file.create-directory')
            ->property('name', $request->input('name'))
            ->property('directory', $request->input('root'))
            ->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Rename file
     *
     * @throws \Throwable
     */
    public function rename(RenameFileRequest $request, Server $server): JsonResponse
    {
        $root = $request->input('root');
        $files = $request->input('files', []);

        foreach ($files as $file) {
            $this->assertPathNotBlocked($server, $request->user(), $this->fileBlockService->join($root, $file['from']));
            $this->assertPathNotBlocked($server, $request->user(), $this->fileBlockService->join($root, $file['to']));
        }

        $this->fileRepository
            ->setServer($server)
            ->renameFiles($root, $files);

        Activity::event('server:file.rename')
            ->property('directory', $root)
            ->property('files', $files)
            ->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Copy file
     *
     * @throws \Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException
     */
    public function copy(CopyFileRequest $request, Server $server): JsonResponse
    {
        $this->assertPathNotBlocked($server, $request->user(), $request->input('location'));

        $this->fileRepository
            ->setServer($server)
            ->copyFile($request->input('location'));

        Activity::event('server:file.copy')->property('file', $request->input('location'))->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Compress files
     *
     * @throws \Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException
     */
    public function compress(CompressFilesRequest $request, Server $server): array
    {
        $root = $request->input('root');
        $this->assertNamesNotBlocked($server, $request->user(), $root, $request->input('files', []));

        $file = $this->fileRepository->setServer($server)->compressFiles(
            $root,
            $request->input('files')
        );

        Activity::event('server:file.compress')
            ->property('directory', $root)
            ->property('files', $request->input('files'))
            ->log();

        return $this->fractal->item($file)
            ->transformWith($this->getTransformer(FileObjectTransformer::class))
            ->toArray();
    }

    /**
     * Decompress files
     *
     * @throws \Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException
     */
    public function decompress(DecompressFilesRequest $request, Server $server): JsonResponse
    {
        set_time_limit(300);

        $root = $request->input('root');
        $this->assertPathNotBlocked(
            $server,
            $request->user(),
            $this->fileBlockService->join($root, $request->input('file'))
        );

        $this->fileRepository->setServer($server)->decompressFile(
            $root,
            $request->input('file')
        );

        Activity::event('server:file.decompress')
            ->property('directory', $root)
            ->property('files', $request->input('file'))
            ->log();

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Delete files
     *
     * @throws \Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException
     */
    public function delete(DeleteFileRequest $request, Server $server): JsonResponse
    {
        $root = $request->input('root');
        $this->assertNamesNotBlocked($server, $request->user(), $root, $request->input('files', []));

        $this->fileRepository->setServer($server)->deleteFiles(
            $root,
            $request->input('files')
        );

        Activity::event('server:file.delete')
            ->property('directory', $root)
            ->property('files', $request->input('files'))
            ->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Update file permissions
     *
     * @throws \Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException
     */
    public function chmod(ChmodFilesRequest $request, Server $server): JsonResponse
    {
        $root = $request->input('root');
        $names = array_map(
            static fn (array $file) => $file['file'] ?? '',
            $request->input('files', [])
        );
        $this->assertNamesNotBlocked($server, $request->user(), $root, array_filter($names));

        $this->fileRepository->setServer($server)->chmodFiles(
            $root,
            $request->input('files')
        );

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Pull file from URL
     *
     * @throws \Throwable
     */
    public function pull(PullFileRequest $request, Server $server): JsonResponse
    {
        $directory = $request->input('directory') ?? '/';
        $filename = $request->input('filename');
        $target = $filename
            ? $this->fileBlockService->join($directory, $filename)
            : $this->fileBlockService->normalize($directory);
        $this->assertPathNotBlocked($server, $request->user(), $target);

        $this->fileRepository->setServer($server)->pull(
            $request->input('url'),
            $directory,
            $request->safe(['filename', 'use_header', 'foreground'])
        );

        Activity::event('server:file.pull')
            ->property('directory', $directory)
            ->property('url', $request->input('url'))
            ->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }
}
