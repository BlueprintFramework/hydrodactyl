<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Users;

use Pterodactyl\Models\User;
use Illuminate\Http\JsonResponse;
use Spatie\QueryBuilder\QueryBuilder;
use Pterodactyl\Services\Users\UserUpdateService;
use Pterodactyl\Services\Users\UserCreationService;
use Pterodactyl\Services\Users\UserDeletionService;
use Pterodactyl\Transformers\Api\Application\UserTransformer;
use Pterodactyl\Http\Requests\Api\Application\Users\GetUsersRequest;
use Pterodactyl\Http\Requests\Api\Application\Users\StoreUserRequest;
use Pterodactyl\Http\Requests\Api\Application\Users\DeleteUserRequest;
use Pterodactyl\Http\Requests\Api\Application\Users\UpdateUserRequest;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;

class UserController extends ApplicationApiController
{
    /**
     * UserController constructor.
     */
    public function __construct(
        private UserCreationService $creationService,
        private UserDeletionService $deletionService,
        private UserUpdateService $updateService,
    ) {
        parent::__construct();
    }

    /**
     * List all users
     */
    public function index(GetUsersRequest $request): array
    {
        $users = QueryBuilder::for(User::query()->withCount('servers'))
            ->allowedFilters(['email', 'uuid', 'username', 'external_id'])
            ->allowedSorts(['id', 'uuid'])
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($users)
            ->transformWith($this->getTransformer(UserTransformer::class))
            ->toArray();
    }

    /**
     * View a single user
     */
    public function view(GetUsersRequest $request, User $user): array
    {
        $user->loadCount('servers');

        return $this->fractal->item($user)
            ->transformWith($this->getTransformer(UserTransformer::class))
            ->toArray();
    }

    /**
     * Update a user
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(UpdateUserRequest $request, User $user): array
    {
        $this->updateService->setUserLevel(User::USER_LEVEL_ADMIN);
        $user = $this->updateService->handle($user, $request->validated());

        $response = $this->fractal->item($user)
            ->transformWith($this->getTransformer(UserTransformer::class));

        return $response->toArray();
    }

    /**
     * Create a new user
     *
     * @throws \Exception
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->creationService->handle($request->validated());

        return $this->fractal->item($user)
            ->transformWith($this->getTransformer(UserTransformer::class))
            ->addMeta([
                'resource' => route('api.application.users.view', [
                    'user' => $user->id,
                ]),
            ])
            ->respond(201);
    }

    /**
     * Delete a user
     *
     * @throws \Pterodactyl\Exceptions\DisplayException
     */
    public function delete(DeleteUserRequest $request, User $user): JsonResponse
    {
        $this->deletionService->handle($user);

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }
}
