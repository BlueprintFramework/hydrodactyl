<?php

namespace Pterodactyl\Http\Controllers\Base;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Traits\Helpers\AvailableLanguages;

class LocaleDictionaryController extends Controller
{
    use AvailableLanguages;

    /**
     * Return the panel UI dictionary for the requested locale. Languages are
     * served straight from resources/lang, so dropping a translated folder on
     * the server is enough for it to show up without rebuilding the frontend.
     */
    public function __invoke(Request $request, string $locale): JsonResponse
    {
        abort_unless(in_array($locale, array_keys($this->getAvailableLanguages()), true), 404);

        $path = resource_path("lang/{$locale}/ui.json");

        abort_unless(is_file($path), 404);

        $contents = file_get_contents($path);

        $response = new JsonResponse(json_decode($contents, true));
        $response->setPublic();
        $response->setMaxAge(0);
        $response->setEtag(md5($contents));
        $response->isNotModified($request);

        return $response;
    }
}
