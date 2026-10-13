import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage } from '@/api/admin/errors';
import { addServerMount, removeServerMount, type ServerMount } from '@/api/admin/servers';
import { useServerMounts } from '@/api/admin/useServers';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

const ServerMountsContainer = () => {
    const { t } = useTranslation();
    const { id } = useParams<'id'>();
    const { data, mutate } = useServerMounts(id);
    const [busy, setBusy] = useState<number>();

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const toggle = async (mount: ServerMount) => {
        setBusy(mount.id);

        try {
            if (mount.is_mounted) {
                await removeServerMount(Number(id), mount.id);
                toast.success(t('admin.servers.mount_removed'));
            } else {
                await addServerMount(Number(id), mount.id);
                toast.success(t('admin.servers.mount_added'));
            }

            await mutate();
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.servers.mount_update_failed')));
        } finally {
            setBusy(undefined);
        }
    };

    return (
        <div className='overflow-x-auto rounded-xl border border-mocha-400'>
            <table className='w-full text-sm'>
                <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                    <tr className='border-b border-mocha-400'>
                        <th className='px-4 py-3'>{t('admin.common.id')}</th>
                        <th className='px-4 py-3'>{t('admin.common.name')}</th>
                        <th className='px-4 py-3'>{t('admin.mounts.source')}</th>
                        <th className='px-4 py-3'>{t('admin.mounts.target')}</th>
                        <th className='px-4 py-3'>{t('admin.common.status')}</th>
                        <th className='px-4 py-3' />
                    </tr>
                </thead>
                <tbody>
                    {data.map((mount) => (
                        <tr key={mount.id} className='border-b border-mocha-400/40'>
                            <td className='px-4 py-3'>
                                <code className='text-xs text-cream-400/60'>{mount.id}</code>
                            </td>
                            <td className='px-4 py-3'>
                                <Link to={`/mounts/${mount.id}`} className='text-cream-50 hover:text-hydro-400'>
                                    {mount.name}
                                </Link>
                            </td>
                            <td className='px-4 py-3'>
                                <code className='text-xs text-cream-400/70'>{mount.source}</code>
                            </td>
                            <td className='px-4 py-3'>
                                <code className='text-xs text-cream-400/70'>{mount.target}</code>
                            </td>
                            <td className='px-4 py-3'>
                                <span
                                    className={cn(
                                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                                        mount.is_mounted
                                            ? 'bg-hydro-500/20 text-hydro-400'
                                            : 'bg-mocha-300 text-cream-400',
                                    )}
                                >
                                    {mount.is_mounted ? t('admin.servers.mounted') : t('admin.servers.unmounted')}
                                </span>
                            </td>
                            <td className='px-4 py-3'>
                                <div className='flex justify-end'>
                                    <Button
                                        size='sm'
                                        variant={mount.is_mounted ? 'attention' : 'secondary'}
                                        disabled={busy === mount.id}
                                        onClick={() => void toggle(mount)}
                                    >
                                        {mount.is_mounted
                                            ? t('admin.servers.unmount_button')
                                            : t('admin.servers.mount_button')}
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={6} className='px-4 py-6 text-center text-cream-400/50'>
                                {t('admin.servers.no_mounts')}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ServerMountsContainer;
