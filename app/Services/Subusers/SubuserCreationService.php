<?php

namespace Pterodactyl\Services\Subusers;

use Illuminate\Support\Str;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Subuser;
use Illuminate\Database\ConnectionInterface;
use Pterodactyl\Services\Users\UserCreationService;
use Pterodactyl\Repositories\Eloquent\SubuserRepository;
use Pterodactyl\Contracts\Repository\UserRepositoryInterface;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Exceptions\Repository\RecordNotFoundException;
use Pterodactyl\Exceptions\Service\Subuser\UserIsServerOwnerException;
use Pterodactyl\Exceptions\Service\Subuser\ServerSubuserExistsException;

class SubuserCreationService
{
    /**
     * SubuserCreationService constructor.
     */
    public function __construct(
        private ConnectionInterface $connection,
        private SubuserRepository $subuserRepository,
        private UserCreationService $userCreationService,
        private UserRepositoryInterface $userRepository,
    ) {
    }

    /**
     * Creates a new user on the system and assigns them access to the provided server.
     * If the email address already belongs to a user on the system a new user will not
     * be created.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws ServerSubuserExistsException
     * @throws UserIsServerOwnerException
     * @throws \Throwable
     */
    public function handle(Server $server, string $email, array $permissions): Subuser
    {
        return $this->connection->transaction(function () use ($server, $email, $permissions) {
            $identifier = trim($email);

            try {
                $user = $this->userRepository->findFirstWhere([['email', '=', $identifier]]);
            } catch (RecordNotFoundException) {
                try {
                    $user = $this->userRepository->findFirstWhere([['username', '=', mb_strtolower($identifier)]]);
                } catch (RecordNotFoundException) {
                    if (!filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
                        throw new DisplayException('No account uses that username. Enter their email to invite them.');
                    }

                    // Just cap the username generated at 64 characters at most and then append a random string
                    // to the end to make it "unique"...
                    $username = substr(preg_replace('/([^\w\.-]+)/', '', strtok($identifier, '@')), 0, 64) . Str::random(3);

                    $user = $this->userCreationService->handle([
                        'email' => $identifier,
                        'username' => $username,
                        'name_first' => 'Server',
                        'name_last' => 'Subuser',
                        'root_admin' => false,
                    ]);
                }
            }

            if ($server->owner_id === $user->id) {
                throw new UserIsServerOwnerException(trans('exceptions.subusers.user_is_owner'));
            }

            $subuserCount = $this->subuserRepository->findCountWhere([['user_id', '=', $user->id], ['server_id', '=', $server->id]]);
            if ($subuserCount !== 0) {
                throw new ServerSubuserExistsException(trans('exceptions.subusers.subuser_exists'));
            }

            return $this->subuserRepository->create([
                'user_id' => $user->id,
                'server_id' => $server->id,
                'permissions' => array_unique($permissions),
            ]);
        });
    }
}
