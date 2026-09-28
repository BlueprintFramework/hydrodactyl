import { useStoreState } from 'easy-peasy';
import { useField } from 'formik';

import { Checkbox } from '@/components/elements/CheckboxNew';
import { useTranslation } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/types';

interface Props {
    permission: string;
    disabled: boolean;
}

const PERMISSION_KEYS: Record<string, { description: TranslationKey; title: TranslationKey }> = {
    'activity.read': {
        description: 'server.users.permissions.activity_read.description',
        title: 'server.users.permissions.activity_read.title',
    },
    'allocation.create': {
        description: 'server.users.permissions.allocation_create.description',
        title: 'server.users.permissions.allocation_create.title',
    },
    'allocation.delete': {
        description: 'server.users.permissions.allocation_delete.description',
        title: 'server.users.permissions.allocation_delete.title',
    },
    'allocation.read': {
        description: 'server.users.permissions.allocation_read.description',
        title: 'server.users.permissions.allocation_read.title',
    },
    'allocation.update': {
        description: 'server.users.permissions.allocation_update.description',
        title: 'server.users.permissions.allocation_update.title',
    },
    'backup.create': {
        description: 'server.users.permissions.backup_create.description',
        title: 'server.users.permissions.backup_create.title',
    },
    'backup.delete': {
        description: 'server.users.permissions.backup_delete.description',
        title: 'server.users.permissions.backup_delete.title',
    },
    'backup.download': {
        description: 'server.users.permissions.backup_download.description',
        title: 'server.users.permissions.backup_download.title',
    },
    'backup.read': {
        description: 'server.users.permissions.backup_read.description',
        title: 'server.users.permissions.backup_read.title',
    },
    'backup.restore': {
        description: 'server.users.permissions.backup_restore.description',
        title: 'server.users.permissions.backup_restore.title',
    },
    'control.console': {
        description: 'server.users.permissions.control_console.description',
        title: 'server.users.permissions.control_console.title',
    },
    'control.restart': {
        description: 'server.users.permissions.control_restart.description',
        title: 'server.users.permissions.control_restart.title',
    },
    'control.start': {
        description: 'server.users.permissions.control_start.description',
        title: 'server.users.permissions.control_start.title',
    },
    'control.stop': {
        description: 'server.users.permissions.control_stop.description',
        title: 'server.users.permissions.control_stop.title',
    },
    'database.create': {
        description: 'server.users.permissions.database_create.description',
        title: 'server.users.permissions.database_create.title',
    },
    'database.delete': {
        description: 'server.users.permissions.database_delete.description',
        title: 'server.users.permissions.database_delete.title',
    },
    'database.read': {
        description: 'server.users.permissions.database_read.description',
        title: 'server.users.permissions.database_read.title',
    },
    'database.update': {
        description: 'server.users.permissions.database_update.description',
        title: 'server.users.permissions.database_update.title',
    },
    'database.view_password': {
        description: 'server.users.permissions.database_view_password.description',
        title: 'server.users.permissions.database_view_password.title',
    },
    'file.archive': {
        description: 'server.users.permissions.file_archive.description',
        title: 'server.users.permissions.file_archive.title',
    },
    'file.create': {
        description: 'server.users.permissions.file_create.description',
        title: 'server.users.permissions.file_create.title',
    },
    'file.delete': {
        description: 'server.users.permissions.file_delete.description',
        title: 'server.users.permissions.file_delete.title',
    },
    'file.read': {
        description: 'server.users.permissions.file_read.description',
        title: 'server.users.permissions.file_read.title',
    },
    'file.read-content': {
        description: 'server.users.permissions.file_read_content.description',
        title: 'server.users.permissions.file_read_content.title',
    },
    'file.sftp': {
        description: 'server.users.permissions.file_sftp.description',
        title: 'server.users.permissions.file_sftp.title',
    },
    'file.update': {
        description: 'server.users.permissions.file_update.description',
        title: 'server.users.permissions.file_update.title',
    },
    'mod.download': {
        description: 'server.users.permissions.mod_download.description',
        title: 'server.users.permissions.mod_download.title',
    },
    'mod.loader': {
        description: 'server.users.permissions.mod_loader.description',
        title: 'server.users.permissions.mod_loader.title',
    },
    'mod.resolver': {
        description: 'server.users.permissions.mod_resolver.description',
        title: 'server.users.permissions.mod_resolver.title',
    },
    'mod.update': {
        description: 'server.users.permissions.mod_update.description',
        title: 'server.users.permissions.mod_update.title',
    },
    'mod.version': {
        description: 'server.users.permissions.mod_version.description',
        title: 'server.users.permissions.mod_version.title',
    },
    'schedule.create': {
        description: 'server.users.permissions.schedule_create.description',
        title: 'server.users.permissions.schedule_create.title',
    },
    'schedule.delete': {
        description: 'server.users.permissions.schedule_delete.description',
        title: 'server.users.permissions.schedule_delete.title',
    },
    'schedule.read': {
        description: 'server.users.permissions.schedule_read.description',
        title: 'server.users.permissions.schedule_read.title',
    },
    'schedule.update': {
        description: 'server.users.permissions.schedule_update.description',
        title: 'server.users.permissions.schedule_update.title',
    },
    'settings.reinstall': {
        description: 'server.users.permissions.settings_reinstall.description',
        title: 'server.users.permissions.settings_reinstall.title',
    },
    'settings.rename': {
        description: 'server.users.permissions.settings_rename.description',
        title: 'server.users.permissions.settings_rename.title',
    },
    'startup.command': {
        description: 'server.users.permissions.startup_command.description',
        title: 'server.users.permissions.startup_command.title',
    },
    'startup.docker-image': {
        description: 'server.users.permissions.startup_docker_image.description',
        title: 'server.users.permissions.startup_docker_image.title',
    },
    'startup.read': {
        description: 'server.users.permissions.startup_read.description',
        title: 'server.users.permissions.startup_read.title',
    },
    'startup.software': {
        description: 'server.users.permissions.startup_software.description',
        title: 'server.users.permissions.startup_software.title',
    },
    'startup.update': {
        description: 'server.users.permissions.startup_update.description',
        title: 'server.users.permissions.startup_update.title',
    },
    'user.create': {
        description: 'server.users.permissions.user_create.description',
        title: 'server.users.permissions.user_create.title',
    },
    'user.delete': {
        description: 'server.users.permissions.user_delete.description',
        title: 'server.users.permissions.user_delete.title',
    },
    'user.read': {
        description: 'server.users.permissions.user_read.description',
        title: 'server.users.permissions.user_read.title',
    },
    'user.update': {
        description: 'server.users.permissions.user_update.description',
        title: 'server.users.permissions.user_update.title',
    },
    'websocket.connect': {
        description: 'server.users.permissions.websocket_connect.description',
        title: 'server.users.permissions.websocket_connect.title',
    },
};

const PermissionRow = ({ permission, disabled }: Props) => {
    const { t } = useTranslation();
    const [key = '', pkey = ''] = permission.split('.', 2);
    const permissions = useStoreState((state) => state.permissions.data);
    const [{ value }, , { setValue }] = useField<string[]>('permissions');

    const checked = value?.includes(permission) ?? false;
    const details = PERMISSION_KEYS[permission];
    const apiDescription = permissions[key]?.keys?.[pkey];

    return (
        <label
            htmlFor={`permission_${permission}`}
            className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#ffffff06]'
            }`}
        >
            <Checkbox
                id={`permission_${permission}`}
                name='permissions'
                value={permission}
                checked={checked}
                onCheckedChange={() => {
                    if (checked) {
                        setValue(value.filter((p) => p !== permission));
                    } else {
                        setValue([...value, permission]);
                    }
                }}
                disabled={disabled}
                className='mt-0.5'
            />
            <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-zinc-200'>{details ? t(details.title) : pkey}</p>
                {(apiDescription?.length ?? 0) > 0 && (
                    <p className='text-xs text-zinc-400 mt-0.5'>
                        {details ? t(details.description) : (apiDescription ?? '')}
                    </p>
                )}
            </div>
        </label>
    );
};

export default PermissionRow;
