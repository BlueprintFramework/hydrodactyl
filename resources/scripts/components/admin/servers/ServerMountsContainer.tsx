import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage } from '@/api/admin/errors';
import { addServerMount, removeServerMount, type ServerMount } from '@/api/admin/servers';
import { useServerMounts } from '@/api/admin/useServers';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ServerMountsContainer = () => {
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
                toast.success('Mount removed.');
            } else {
                await addServerMount(Number(id), mount.id);
                toast.success('Mount added.');
            }

            await mutate();
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to update the mount.'));
        } finally {
            setBusy(undefined);
        }
    };

    return (
        <div className='overflow-x-auto rounded-xl border border-mocha-400'>
            <table className='w-full text-sm'>
                <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                    <tr className='border-b border-mocha-400'>
                        <th className='px-4 py-3'>ID</th>
                        <th className='px-4 py-3'>Name</th>
                        <th className='px-4 py-3'>Source</th>
                        <th className='px-4 py-3'>Target</th>
                        <th className='px-4 py-3'>Status</th>
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
                                <a
                                    href={`/admin/mounts/view/${mount.id}`}
                                    className='text-cream-50 hover:text-hydro-400'
                                >
                                    {mount.name}
                                </a>
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
                                    {mount.is_mounted ? 'Mounted' : 'Unmounted'}
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
                                        {mount.is_mounted ? 'Unmount' : 'Mount'}
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={6} className='px-4 py-6 text-center text-cream-400/50'>
                                No mounts are available for this server.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ServerMountsContainer;
