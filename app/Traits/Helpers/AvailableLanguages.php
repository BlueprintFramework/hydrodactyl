<?php

namespace Pterodactyl\Traits\Helpers;

use Locale as IntlLocale;
use Matriphe\ISO639\ISO639;
use Illuminate\Filesystem\Filesystem;

trait AvailableLanguages
{
    private ?ISO639 $iso639 = null;

    private ?Filesystem $filesystem = null;

    /**
     * Return all the available languages on the Panel based on those
     * that are present in the language folder. Any directory placed in
     * resources/lang is picked up automatically (e.g. "en-US", "fr-FR").
     */
    public function getAvailableLanguages(bool $localize = false): array
    {
        return collect($this->getFilesystemInstance()->directories(resource_path('lang')))->mapWithKeys(function ($path) use ($localize) {
            $code = basename($path);

            return [$code => $this->getLanguageName($code, $localize)];
        })->toArray();
    }

    /**
     * Resolve a human readable name for the given locale code. Prefers the intl
     * extension (which understands region codes such as "en-US"), falling back
     * to the ISO 639-1 database used historically.
     */
    private function getLanguageName(string $code, bool $localize): string
    {
        $icu = str_replace('-', '_', $code);

        if (class_exists(IntlLocale::class)) {
            $name = $localize
                ? IntlLocale::getDisplayName($icu, $icu)
                : IntlLocale::getDisplayName($icu, 'en_US');

            // Unknown codes are echoed back as the code itself; fall through to
            // the ISO fallback instead of showing something useless.
            if (!empty($name) && strcasecmp(str_replace('_', '-', $name), $code) !== 0) {
                return title_case($name);
            }
        }

        try {
            [$language, $region] = array_pad(explode('-', $code, 2), 2, null);

            $value = $localize
                ? $this->getIsoInstance()->nativeByCode1($language)
                : $this->getIsoInstance()->languageByCode1($language);

            if (!empty($value)) {
                return $region ? title_case($value) . ' (' . strtoupper($region) . ')' : title_case($value);
            }
        } catch (\Throwable) {
            // Fall through and display the raw code below.
        }

        return $code;
    }

    /**
     * Return an instance of the filesystem for getting a folder listing.
     */
    private function getFilesystemInstance(): Filesystem
    {
        return $this->filesystem = $this->filesystem ?: app()->make(Filesystem::class);
    }

    /**
     * Return an instance of the ISO639 class for generating names.
     */
    private function getIsoInstance(): ISO639
    {
        return $this->iso639 = $this->iso639 ?: app()->make(ISO639::class);
    }
}
