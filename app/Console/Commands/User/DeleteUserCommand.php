<?php

namespace Pterodactyl\Console\Commands\User;

use Pterodactyl\Models\User;
use Webmozart\Assert\Assert;
use Illuminate\Console\Command;
use Pterodactyl\Services\Users\UserDeletionService;

class DeleteUserCommand extends Command
{
    protected $description = 'Deletes a user from the Panel if no servers are attached to their account.';

    protected $signature = 'p:user:delete {--user=}';

    /**
     * DeleteUserCommand constructor.
     */
    public function __construct(private UserDeletionService $deletionService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $search = $this->option('user') ?? $this->ask(__('command/messages.user.search_users'));
        Assert::notEmpty($search, 'Search term should be an email address, got: %s.');

        $results = User::query()
            ->where('id', 'LIKE', "$search%")
            ->orWhere('username', 'LIKE', "$search%")
            ->orWhere('email', 'LIKE', "$search%")
            ->get();

        if (count($results) < 1) {
            $this->error(__('command/messages.user.no_users_found'));
            if ($this->input->isInteractive()) {
                return $this->handle();
            }

            return 1;
        }

        if ($this->input->isInteractive()) {
            $tableValues = [];
            foreach ($results as $user) {
                $tableValues[] = [$user->id, $user->email, $user->name];
            }

            $this->table(['User ID', 'Email', 'Name'], $tableValues);
            if (!$deleteUser = $this->ask(__('command/messages.user.select_search_user'))) {
                return $this->handle();
            }
        } else {
            if (count($results) > 1) {
                $this->error(__('command/messages.user.multiple_found'));

                return 1;
            }

            $deleteUser = $results->first();
        }

        if ($this->confirm(__('command/messages.user.confirm_delete')) || !$this->input->isInteractive()) {
            $this->deletionService->handle($deleteUser);
            $this->info(__('command/messages.user.deleted'));
        }

        return 0;
    }
}
