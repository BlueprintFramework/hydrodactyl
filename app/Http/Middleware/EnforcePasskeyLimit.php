<?php

namespace Pterodactyl\Http\Middleware;

use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Pterodactyl\Models\User;
use Symfony\Component\HttpFoundation\Response;

class EnforcePasskeyLimit
{
    public function handle(Request $request, \Closure $next): Response
    {
        $user = $request->user();

        if (!$user instanceof User) {
            return $next($request);
        }

        $max = (int) config('passkeys.max_per_user', 10);

        if ($max > 0 && $user->passkeys()->count() >= $max) {
            return response()->json([
                'message' => __('validation.json_api.passkey_limit_reached', ['max' => $max]),
                'max_passkeys' => $max,
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($request->isMethod('post')) {
            $name = trim((string) $request->input('name'));

            if ($name !== '' && $user->passkeys()
                ->whereRaw('LOWER(TRIM(name)) = ?', [Str::lower($name)])
                ->exists()) {
                return response()->json([
                    'message' => __('validation.json_api.passkey_name_taken'),
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        return $next($request);
    }
}
