<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Illuminate\Auth\AuthManager;
use Illuminate\Container\Container;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Contracts\View\View;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Illuminate\Validation\ValidationException;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\User;
use Pterodactyl\Rules\Username;
use Pterodactyl\Events\Auth\DirectLogin;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Users\UserCreationService;

class SetupController extends Controller
{
    protected AuthManager $auth;

    /**
     * SetupController constructor.
     */
    public function __construct(
        private ViewFactory $view,
        private UserCreationService $creationService,
    ) {
        $this->auth = Container::getInstance()->make(AuthManager::class);
    }

    /**
     * Render the SPA shell and let React take over for the guided setup flow.
     */
    public function index(): View
    {
        return $this->view->make('templates/auth.core');
    }

    /**
     * Create the first administrator account and sign the user in.
     *
     * @throws \Illuminate\Validation\ValidationException
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Exception
     */
    public function store(Request $request): JsonResponse
    {
        // Defense in depth: the SetupRequired middleware already blocks this route
        // once any user exists, but we re-check here so the handler can never be
        // tricked into creating a second account.
        if (User::query()->exists()) {
            abort(404);
        }

        $data = $this->validate($request, [
            'email' => ['required', 'string', 'email:rfc', 'between:1,191', 'unique:users,email'],
            'username' => ['required', 'string', 'between:1,191', 'unique:users,username', new Username()],
            'name_first' => ['required', 'string', 'between:1,191'],
            'name_last' => ['nullable', 'string', 'between:0,191'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // The cross-process lock below only serializes on an atomic cache driver
        // (redis/memcached/database/dynamodb). Refuse to run on a non-atomic driver
        // (e.g. array/file) rather than silently degrading the race protection.
        if (!in_array(config('cache.default'), ['redis', 'memcached', 'database', 'dynamodb'], true)) {
            Log::critical('Setup endpoint invoked with a non-atomic cache driver.', [
                'driver' => config('cache.default'),
            ]);
            abort(500, 'The setup flow requires an atomic cache driver.');
        }

        // Serialize creation across concurrent requests. Two near-simultaneous
        // POSTs while the table is empty could otherwise both pass the exists()
        // check above and create distinct administrator accounts. This cross-
        // process lock guarantees only one request enters the create block; the
        // re-check inside it then 404s the loser. Requires an atomic cache driver
        // (Redis, the panel default) to serialize across workers.
        $lock = Cache::lock('pterodactyl:setup', 30);

        try {
            $lock->block(10);

            if (User::query()->exists()) {
                abort(404);
            }

            /** @var User $user */
            $user = $this->creationService->handle([
                'email' => $data['email'],
                'username' => $data['username'],
                'name_first' => $data['name_first'],
                'name_last' => $data['name_last'] ?? null,
                'password' => $data['password'],
                'root_admin' => true,
            ]);
        } finally {
            $lock->release();
        }

        $request->session()->regenerate();
        $this->auth->guard()->login($user, true);
        Event::dispatch(new DirectLogin($user, true));

        Activity::event('setup:admin-created')
            ->withRequestMetadata()
            ->subject($user)
            ->log('created the first administrator account via the web setup flow');

        return new JsonResponse([
            'data' => [
                'complete' => true,
                'intended' => '/',
            ],
        ]);
    }
}
