<?php

namespace Pterodactyl\Http\Controllers\Admin\Api;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Subuser;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Contracts\Translation\Translator;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Pterodactyl\Services\Users\UserUpdateService;
use Pterodactyl\Services\Users\UserCreationService;
use Pterodactyl\Services\Users\UserDeletionService;
use Pterodactyl\Http\Requests\Admin\UserFormRequest;
use Pterodactyl\Http\Requests\Admin\NewUserFormRequest;

class UserController extends Controller
{
    use AvailableLanguages;

    /**
     * UserController constructor.
     */
    public function __construct(
        private UserCreationService $creationService,
        private UserUpdateService $updateService,
        private UserDeletionService $deletionService,
        private Translator $translator,
    ) {
    }

    /**
     * Return a paginated list of users.
     */
    public function index(Request $request): JsonResponse
    {
        $users = QueryBuilder::for(
            User::query()->select([
                'users.id',
                'users.uuid',
                'users.username',
                'users.email',
                'users.use_totp',
                'users.root_admin',
                'users.language',
                'users.name_first',
                'users.name_last',
                'users.created_at',
            ])
                ->selectRaw('COUNT(DISTINCT(subusers.id)) as subuser_of_count')
                ->selectRaw('COUNT(DISTINCT(servers.id)) as servers_count')
                ->leftJoin('subusers', 'subusers.user_id', '=', 'users.id')
                ->leftJoin('servers', 'servers.owner_id', '=', 'users.id')
                ->groupBy([
                    'users.id',
                    'users.uuid',
                    'users.username',
                    'users.email',
                    'users.use_totp',
                    'users.root_admin',
                    'users.language',
                    'users.name_first',
                    'users.name_last',
                    'users.created_at',
                ])
        )
            ->allowedFilters([
                AllowedFilter::exact('id'),
                AllowedFilter::callback('search', function ($query, $value) {
                    $query->where(function ($query) use ($value) {
                        $query->where('users.username', 'like', "%{$value}%")
                            ->orWhere('users.email', 'like', "%{$value}%");
                    });
                }),
            ])
            ->allowedSorts([
                AllowedSort::field('id', 'users.id'),
                AllowedSort::field('username', 'users.username'),
                AllowedSort::field('email', 'users.email'),
                AllowedSort::field('created_at', 'users.created_at'),
            ])
            ->defaultSort('id')
            ->paginate(min((int) $request->query('per_page', 25), 100));

        return response()->json([
            'data' => collect($users->items())->map(fn (User $user) => $this->transform($user))->values(),
            'meta' => [
                'pagination' => [
                    'total' => $users->total(),
                    'count' => $users->count(),
                    'per_page' => $users->perPage(),
                    'current_page' => $users->currentPage(),
                    'total_pages' => $users->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * Return a single user.
     */
    public function view(User $user): JsonResponse
    {
        $user->servers_count = $user->servers()->count();
        $user->subuser_of_count = Subuser::query()->where('user_id', $user->id)->count();

        return response()->json($this->transform($user));
    }

    /**
     * Return the languages available for a user account.
     */
    public function languages(): JsonResponse
    {
        return response()->json(['data' => $this->getAvailableLanguages(true)]);
    }

    /**
     * Create a new user.
     *
     * @throws \Exception
     * @throws \Throwable
     */
    public function store(NewUserFormRequest $request): JsonResponse
    {
        $user = $this->creationService->handle($request->normalize());

        return response()->json($this->transform($user), JsonResponse::HTTP_CREATED);
    }

    /**
     * Update an existing user.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(UserFormRequest $request, User $user): JsonResponse
    {
        $user = $this->updateService
            ->setUserLevel(User::USER_LEVEL_ADMIN)
            ->handle($user, $request->normalize());

        return response()->json($this->transform($user));
    }

    /**
     * Delete a user from the system.
     *
     * @throws \Exception
     * @throws DisplayException
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->id === $user->id) {
            throw new DisplayException($this->translator->get('admin/user.exceptions.user_has_servers'));
        }

        $this->deletionService->handle($user);

        return response()->json([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Map a user model into the shape consumed by the admin interface.
     */
    private function transform(User $user): array
    {
        return [
            'id' => $user->id,
            'uuid' => $user->uuid,
            'username' => $user->username,
            'email' => $user->email,
            'name_first' => $user->name_first,
            'name_last' => $user->name_last,
            'root_admin' => (bool) $user->root_admin,
            'use_totp' => (bool) $user->use_totp,
            'language' => $user->language,
            'servers_count' => (int) ($user->servers_count ?? 0),
            'subuser_of_count' => (int) ($user->subuser_of_count ?? 0),
            'created_at' => $user->created_at?->toIso8601String(),
        ];
    }
}
