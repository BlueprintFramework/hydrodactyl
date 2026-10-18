<?php

namespace Pterodactyl\Models;

use Illuminate\Support\Collection;

class Permission extends Model
{
    /**
     * The resource name for this model when it is transformed into an
     * API representation using fractal.
     */
    public const RESOURCE_NAME = 'subuser_permission';

    /**
     * Constants defining different permissions available.
     */
    public const ACTION_WEBSOCKET_CONNECT = 'websocket.connect';
    public const ACTION_CONTROL_CONSOLE = 'control.console';
    public const ACTION_CONTROL_START = 'control.start';
    public const ACTION_CONTROL_STOP = 'control.stop';
    public const ACTION_CONTROL_RESTART = 'control.restart';

    public const ACTION_DATABASE_READ = 'database.read';
    public const ACTION_DATABASE_CREATE = 'database.create';
    public const ACTION_DATABASE_UPDATE = 'database.update';
    public const ACTION_DATABASE_DELETE = 'database.delete';
    public const ACTION_DATABASE_VIEW_PASSWORD = 'database.view_password';

    public const ACTION_SCHEDULE_READ = 'schedule.read';
    public const ACTION_SCHEDULE_CREATE = 'schedule.create';
    public const ACTION_SCHEDULE_UPDATE = 'schedule.update';
    public const ACTION_SCHEDULE_DELETE = 'schedule.delete';

    public const ACTION_USER_READ = 'user.read';
    public const ACTION_USER_CREATE = 'user.create';
    public const ACTION_USER_UPDATE = 'user.update';
    public const ACTION_USER_DELETE = 'user.delete';

    public const ACTION_BACKUP_READ = 'backup.read';
    public const ACTION_BACKUP_CREATE = 'backup.create';
    public const ACTION_BACKUP_DELETE = 'backup.delete';
    public const ACTION_BACKUP_DOWNLOAD = 'backup.download';
    public const ACTION_BACKUP_RESTORE = 'backup.restore';

    public const ACTION_ALLOCATION_READ = 'allocation.read';
    public const ACTION_ALLOCATION_CREATE = 'allocation.create';
    public const ACTION_ALLOCATION_UPDATE = 'allocation.update';
    public const ACTION_ALLOCATION_DELETE = 'allocation.delete';
    public const ACTION_ALLOCATION_CUSTOM_DOMAIN_READ = 'allocation.custom_domain_read';
    public const ACTION_ALLOCATION_CUSTOM_DOMAIN_UPDATE = 'allocation.custom_domain_update';

    public const ACTION_FILE_READ = 'file.read';
    public const ACTION_FILE_READ_CONTENT = 'file.read-content';
    public const ACTION_FILE_CREATE = 'file.create';
    public const ACTION_FILE_UPDATE = 'file.update';
    public const ACTION_FILE_DELETE = 'file.delete';
    public const ACTION_FILE_ARCHIVE = 'file.archive';
    public const ACTION_FILE_SFTP = 'file.sftp';

    public const ACTION_STARTUP_READ = 'startup.read';
    public const ACTION_STARTUP_UPDATE = 'startup.update';
    public const ACTION_STARTUP_COMMAND = 'startup.command';
    public const ACTION_STARTUP_DOCKER_IMAGE = 'startup.docker-image';

    public const ACTION_STARTUP_SOFTWARE = 'startup.software';

    public const ACTION_SETTINGS_RENAME = 'settings.rename';
    public const ACTION_SETTINGS_MODR = 'settings.mod';
    public const ACTION_SETTINGS_REINSTALL = 'settings.reinstall';

    public const ACTION_ACTIVITY_READ = 'activity.read';

    public const ACTION_MOD_DOWNLOAD = 'mod.download';

    /**
     * Should timestamps be used on this model.
     */
    public $timestamps = false;

    /**
     * The table associated with the model.
     */
    protected $table = 'permissions';

    /**
     * Fields that are not mass assignable.
     */
    protected $guarded = ['id', 'created_at', 'updated_at'];

    /**
     * Cast values to correct type.
     */
    protected $casts = [
        'subuser_id' => 'integer',
    ];

    public static array $validationRules = [
        'subuser_id' => 'required|numeric|min:1',
        'permission' => 'required|string',
    ];

    /**
     * Returns all the permissions available on the system for a user to
     * have when controlling a server.
     */
    public static function permissions(): Collection
    {
        return Collection::make([
            'websocket' => [
                'description' => __('permissions.websocket.description'),
                'keys' => [
                    'connect' => __('permissions.websocket.connect'),
                ],
            ],

            'control' => [
                'description' => __('permissions.control.description'),
                'keys' => [
                    'console' => __('permissions.control.console'),
                    'start' => __('permissions.control.start'),
                    'stop' => __('permissions.control.stop'),
                    'restart' => __('permissions.control.restart'),
                ],
            ],

            'user' => [
                'description' => __('permissions.user.description'),
                'keys' => [
                    'create' => __('permissions.user.create'),
                    'read' => __('permissions.user.read'),
                    'update' => __('permissions.user.update'),
                    'delete' => __('permissions.user.delete'),
                ],
            ],

            'file' => [
                'description' => __('permissions.file.description'),
                'keys' => [
                    'create' => __('permissions.file.create'),
                    'read' => __('permissions.file.read'),
                    'read-content' => __('permissions.file.read-content'),
                    'update' => __('permissions.file.update'),
                    'delete' => __('permissions.file.delete'),
                    'archive' => __('permissions.file.archive'),
                    'sftp' => __('permissions.file.sftp'),
                ],
            ],

            'backup' => [
                'description' => __('permissions.backup.description'),
                'keys' => [
                    'create' => __('permissions.backup.create'),
                    'read' => __('permissions.backup.read'),
                    'delete' => __('permissions.backup.delete'),
                    'download' => __('permissions.backup.download'),
                    'restore' => __('permissions.backup.restore'),
                ],
            ],

            'allocation' => [
                'description' => __('permissions.allocation.description'),
                'keys' => [
                    'read' => __('permissions.allocation.read'),
                    'create' => __('permissions.allocation.create'),
                    'update' => __('permissions.allocation.update'),
                    'delete' => __('permissions.allocation.delete'),
                    'custom_domain_read' => __('permissions.allocation.custom_domain_read'),
                    'custom_domain_update' => __('permissions.allocation.custom_domain_update'),
                ],
            ],

            'startup' => [
                'description' => __('permissions.startup.description'),
                'keys' => [
                    'read' => __('permissions.startup.read'),
                    'update' => __('permissions.startup.update'),
                    'command' => __('permissions.startup.command'),
                    'docker-image' => __('permissions.startup.docker-image'),
                    'software' => __('permissions.startup.software'),
                ],
            ],

            'database' => [
                'description' => __('permissions.database.description'),
                'keys' => [
                    'create' => __('permissions.database.create'),
                    'read' => __('permissions.database.read'),
                    'update' => __('permissions.database.update'),
                    'delete' => __('permissions.database.delete'),
                    'view_password' => __('permissions.database.view_password'),
                ],
            ],

            'schedule' => [
                'description' => __('permissions.schedule.description'),
                'keys' => [
                    'create' => __('permissions.schedule.create'),
                    'read' => __('permissions.schedule.read'),
                    'update' => __('permissions.schedule.update'),
                    'delete' => __('permissions.schedule.delete'),
                ],
            ],

            'settings' => [
                'description' => __('permissions.settings.description'),
                'keys' => [
                    'rename' => __('permissions.settings.rename'),
                    'reinstall' => __('permissions.settings.reinstall'),
                ],
            ],

            'activity' => [
                'description' => __('permissions.activity.description'),
                'keys' => [
                    'read' => __('permissions.activity.read'),
                ],
            ],

            'mod' => [
                'description' => __('permissions.mod.description'),
                'keys' => [
                    'version' => __('permissions.mod.version'),
                    'loader' => __('permissions.mod.loader'),
                    'download' => __('permissions.mod.download'),
                    'resolver' => __('permissions.mod.resolver'),
                    'update' => __('permissions.mod.update'),
                ],
            ],
        ]);
    }
}
