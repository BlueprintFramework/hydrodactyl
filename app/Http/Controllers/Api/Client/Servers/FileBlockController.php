<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\DeleteFileBlocksRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\ListFileBlocksRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\UpdateFileBlocksRequest;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerFileBlock;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Files\FileBlockService;

class FileBlockController extends ClientApiController
{
    public function __construct(private FileBlockService $fileBlockService)
    {
        parent::__construct();
    }

    /**
     * List file blocks for the server
     */
    public function index(ListFileBlocksRequest $request, Server $server): array
    {
        $blocks = ServerFileBlock::query()
            ->where('server_id', $server->id)
            ->with('user')
            ->orderBy('path')
            ->get();

        return [
            'object' => 'list',
            'data' => $blocks->map(fn (ServerFileBlock $block) => $this->transformBlock($block))->values()->all(),
        ];
    }

    /**
     * Replace blocked subusers for a file path
     *
     * @throws ValidationException
     */
    public function update(UpdateFileBlocksRequest $request, Server $server): array
    {
        $path = $this->fileBlockService->normalize($request->input('path'));
        $uuids = $request->input('user_uuids', []);

        $users = User::query()->whereIn('uuid', $uuids)->get();
        if ($users->count() !== count(array_unique($uuids))) {
            throw ValidationException::withMessages([
                'user_uuids' => [__('validation.exists', ['attribute' => 'user_uuids'])],
            ]);
        }

        $subuserIds = $server->subusers()->pluck('user_id')->all();
        foreach ($users as $user) {
            if (!in_array($user->id, $subuserIds, true)) {
                throw ValidationException::withMessages([
                    'user_uuids' => [__('exceptions.client.files.block_not_subuser')],
                ]);
            }
        }

        $blocks = DB::transaction(function () use ($server, $path, $users) {
            return $this->fileBlockService->syncPathBlocks(
                $server,
                $path,
                $users->pluck('id')->all()
            );
        });

        Activity::event('server:file.block-update')
            ->property('path', $path)
            ->property('user_uuids', $users->pluck('uuid')->values()->all())
            ->log();

        return [
            'object' => 'list',
            'data' => $blocks->map(fn (ServerFileBlock $block) => $this->transformBlock($block))->values()->all(),
        ];
    }

    /**
     * Delete file blocks for a path
     */
    public function delete(DeleteFileBlocksRequest $request, Server $server): JsonResponse
    {
        $path = $this->fileBlockService->normalize($request->input('path'));
        $userId = null;

        if ($request->filled('user_uuid')) {
            $user = User::query()->where('uuid', $request->input('user_uuid'))->firstOrFail();
            $userId = $user->id;
        }

        $this->fileBlockService->deleteBlocks($server, $path, $userId);

        Activity::event('server:file.block-delete')
            ->property('path', $path)
            ->property('user_uuid', $request->input('user_uuid'))
            ->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    private function transformBlock(ServerFileBlock $block): array
    {
        return [
            'object' => ServerFileBlock::RESOURCE_NAME,
            'attributes' => [
                'path' => $block->path,
                'user_uuid' => $block->user->uuid,
                'username' => $block->user->username,
                'created_at' => $block->created_at?->toAtomString(),
            ],
        ];
    }
}
