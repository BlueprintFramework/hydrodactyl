<?php

namespace Pterodactyl\Http\Controllers\Api\Application\Users;

use Pterodactyl\Models\User;
use Pterodactyl\Transformers\Api\Application\UserTransformer;
use Pterodactyl\Http\Controllers\Api\Application\ApplicationApiController;
use Pterodactyl\Http\Requests\Api\Application\Users\GetExternalUserRequest;

class ExternalUserController extends ApplicationApiController
{
    /**
     * Get user by external ID.
     */
    public function index(GetExternalUserRequest $request, string $external_id): array
    {
        $user = User::query()->where('external_id', $external_id)->firstOrFail();

        return $this->fractal->item($user)
            ->transformWith($this->getTransformer(UserTransformer::class))
            ->toArray();
    }
}
