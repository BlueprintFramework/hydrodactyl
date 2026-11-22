<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Contracts\Hashing\Hasher;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Middleware\RequirePasskeyPasswordConfirmation;
use Pterodactyl\Exceptions\Http\Base\InvalidPasswordProvidedException;

class PasskeyPasswordController extends Controller
{
    /**
     * Report whether the current session can manage passkeys without asking
     * for the password again.
     */
    public function status(Request $request): JsonResponse
    {
        return response()->json([
            'confirmed' => RequirePasskeyPasswordConfirmation::isConfirmed($request),
        ]);
    }

    /**
     * Confirm the account password for the current session.
     */
    public function store(Request $request, Hasher $hasher): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        if (!$hasher->check((string) $request->input('password'), $request->user()->password)) {
            throw new InvalidPasswordProvidedException(__('validation.internal.invalid_password'));
        }

        RequirePasskeyPasswordConfirmation::confirm($request);

        return response()->json(['confirmed' => true]);
    }
}
