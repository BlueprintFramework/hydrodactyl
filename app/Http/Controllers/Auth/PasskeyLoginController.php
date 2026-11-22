<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Pterodactyl\Models\User;
use Laravel\Passkeys\Passkeys;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Facades\Activity;
use Laravel\Passkeys\Support\WebAuthn;
use Laravel\Passkeys\Actions\VerifyPasskey;
use Laravel\Passkeys\Actions\GenerateVerificationOptions;
use Laravel\Passkeys\Http\Requests\PasskeyVerificationRequest;

class PasskeyLoginController extends AbstractLoginController
{
    /**
     * Return the WebAuthn request options for a passwordless sign-in.
     */
    public function options(Request $request, GenerateVerificationOptions $generate): JsonResponse
    {
        $options = $generate();

        $request->session()->put('passkey.verification_options', WebAuthn::toJson($options));

        return response()->json([
            'options' => WebAuthn::toBrowserArray($options),
        ]);
    }

    /**
     * Verify a passkey and complete the first factor of authentication.
     *
     * Users with TOTP enabled continue through the existing checkpoint rather
     * than being logged in directly by the package route.
     */
    public function authenticate(
        PasskeyVerificationRequest $request,
        VerifyPasskey $verify,
    ): JsonResponse {
        $passkey = $verify(
            $request->credential(),
            $request->verificationOptions(),
        );

        $user = $passkey->user;

        if (!$user instanceof User) {
            throw new \RuntimeException('The passkey is not associated with a panel user.');
        }

        if (!Passkeys::allowsLogin($request, $passkey)) {
            $this->sendFailedLoginResponse($request, $user);
        }

        if (!$user->use_totp) {
            return $this->sendLoginResponse($user, $request);
        }

        Activity::event('auth:checkpoint')->withRequestMetadata()->subject($user)->log();

        $request->session()->put('auth_confirmation_token', [
            'user_id' => $user->id,
            'token_value' => $token = Str::random(64),
            'expires_at' => CarbonImmutable::now()->addMinutes(5),
        ]);

        return new JsonResponse([
            'data' => [
                'complete' => false,
                'confirmation_token' => $token,
            ],
        ]);
    }
}
