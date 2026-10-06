import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { type Domain, deleteDomain } from '@/api/admin/domains';
import { errorToMessage } from '@/api/admin/errors';
import { useDomains } from '@/api/admin/useDomains';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const statusBadge = (active: boolean) => (active ? 'bg-hydro-500/20 text-hydro-400' : 'bg-mocha-400 text-cream-400/60');

const DomainsContainer = () => {
    const { data, mutate } = useDomains();
    const [pendingDelete, setPendingDelete] = useState<Domain | null>(null);
    const [deleting, setDeleting] = useState(false);

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const confirmDelete = async () => {
        if (!pendingDelete) {
            return;
        }

        setDeleting(true);

        try {
            await deleteDomain(pendingDelete.id);
            await mutate();
            toast.success('Domain deleted.');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete domain.'));
        } finally {
            setDeleting(false);
            setPendingDelete(null);
        }
    };

    const domains = data.data;

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <h2 className='text-sm font-semibold text-cream-50'>Configured Domains</h2>
                <Button asChild>
                    <Link to='/settings/domains/new'>Create Domain</Link>
                </Button>
            </div>

            {domains.length === 0 ? (
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-10 text-center text-sm text-cream-400/60'>
                    No domains configured. Add one to enable subdomain management.
                </div>
            ) : (
                <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                    <table className='w-full text-sm'>
                        <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                            <tr className='border-b border-mocha-400'>
                                <th className='px-4 py-3'>Domain</th>
                                <th className='px-4 py-3'>Provider</th>
                                <th className='px-4 py-3'>Status</th>
                                <th className='px-4 py-3 text-center'>Default</th>
                                <th className='px-4 py-3 text-center'>Subdomains</th>
                                <th className='px-4 py-3 text-right'>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {domains.map((domain) => (
                                <tr key={domain.id} className='border-b border-mocha-400/40 hover:bg-mocha-400/20'>
                                    <td className='px-4 py-3'>
                                        <Link
                                            to={`/settings/domains/${domain.id}`}
                                            className='text-cream-50 hover:text-hydro-400'
                                        >
                                            {domain.name}
                                        </Link>
                                    </td>
                                    <td className='px-4 py-3 capitalize text-cream-100'>{domain.dns_provider}</td>
                                    <td className='px-4 py-3'>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusBadge(domain.is_active)}`}
                                        >
                                            {domain.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className='px-4 py-3 text-center text-cream-400/70'>
                                        {domain.is_default ? 'Yes' : '—'}
                                    </td>
                                    <td className='px-4 py-3 text-center text-cream-100'>{domain.subdomains_count}</td>
                                    <td className='px-4 py-3'>
                                        <div className='flex justify-end gap-2'>
                                            <Button asChild variant='secondary' size='sm'>
                                                <Link to={`/settings/domains/${domain.id}`}>Edit</Link>
                                            </Button>
                                            {domain.subdomains_count === 0 && (
                                                <Button
                                                    variant='attention'
                                                    size='sm'
                                                    onClick={() => setPendingDelete(domain)}
                                                >
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Dialog.Confirm
                open={pendingDelete !== null}
                title='Delete Domain'
                confirm='Delete'
                onClose={() => setPendingDelete(null)}
                onConfirmed={confirmDelete}
                loading={deleting}
            >
                Deleting this domain is permanent and cannot be undone.
            </Dialog.Confirm>
        </div>
    );
};

export default DomainsContainer;
