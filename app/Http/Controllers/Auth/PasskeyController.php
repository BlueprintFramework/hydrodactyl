<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;

class PasskeyController extends Controller
{
    /**
     * Return the current user's registered passkeys for account management.
     */
    public function index(Request $request): JsonResponse
    {
        $passkeys = $request->user()
            ->passkeys()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($passkey) => [
                'id' => $passkey->id,
                'name' => $passkey->name,
                'created_at' => $passkey->created_at?->toIso8601String(),
                'last_used_at' => $passkey->last_used_at?->toIso8601String(),
                'authenticator' => $passkey->authenticator,
            ])
            ->values();

        return response()->json([
            'passkeys' => $passkeys,
            'max' => max(0, (int) config('passkeys.max_per_user', 10)),
        ]);
    }
}
