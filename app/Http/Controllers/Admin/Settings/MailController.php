<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Pterodactyl\Notifications\MailTested;
use Illuminate\Support\Facades\Notification;
use Pterodactyl\Http\Controllers\Controller;

class MailController extends Controller
{
    /**
     * Submit a request to send a test mail message.
     */
    public function test(Request $request): Response
    {
        try {
            Notification::route('mail', $request->user()->email)
                ->notify(new MailTested($request->user()));
        } catch (\Exception $exception) {
            return response($exception->getMessage(), 500);
        }

        return response('', 204);
    }
}
