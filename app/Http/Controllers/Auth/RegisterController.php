<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Illuminate\Auth\AuthManager;
use Illuminate\Container\Container;
use Illuminate\Http\JsonResponse;
use Illuminate\Contracts\View\View;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Illuminate\Support\Facades\Event;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\User;
use Pterodactyl\Events\Auth\DirectLogin;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Auth\RegisterRequest;
use Pterodactyl\Services\Users\UserCreationService;

class RegisterController extends Controller
{
    protected AuthManager $auth;

    public function __construct(
        private ViewFactory $view,
        private UserCreationService $creationService,
    ) {
        $this->auth = Container::getInstance()->make(AuthManager::class);
    }

    public function index(): View
    {
        return $this->view->make('templates/auth.core');
    }

    /**
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Exception
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        /** @var User $user */
        $user = $this->creationService->handle([
            'email' => $data['email'],
            'username' => $data['username'],
            'name_first' => $data['name_first'],
            'name_last' => $data['name_last'] ?? null,
            'password' => $data['password'],
        ]);

        $request->session()->regenerate();
        $this->auth->guard()->login($user, true);
        Event::dispatch(new DirectLogin($user, true));

        Activity::event('auth:register')
            ->withRequestMetadata()
            ->subject($user)
            ->log('registered a new account via the self-registration flow');

        return new JsonResponse([
            'data' => [
                'complete' => true,
                'intended' => '/',
            ],
        ]);
    }
}
