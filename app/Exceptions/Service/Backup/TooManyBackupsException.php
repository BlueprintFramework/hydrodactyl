<?php

namespace Pterodactyl\Exceptions\Service\Backup;

use Pterodactyl\Exceptions\DisplayException;

class TooManyBackupsException extends DisplayException
{
    /**
     * TooManyBackupsException constructor.
     */
    public function __construct(int $backupLimit, ?string $customMessage = null)
    {
        $message = $customMessage ?? __('exceptions.backups.too_many', ['limit' => $backupLimit]);
        parent::__construct($message);
    }
}
