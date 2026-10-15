import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { revokeApplicationApiKey } from '@/api/admin/applicationApi';
import { errorToMessage } from '@/api/admin/errors';
import { useApplicationApiKeys } from '@/api/admin/useApplicationApi';
import { Dialog } from '@/components/elements/dialog';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const CopyButton = ({ value }: { value: string }) => {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        if (!navigator.clipboard) {
            toast.error('Clipboard is not available in this context.');
            return;
        }

        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <Button type='button' variant='secondary' size='sm' onClick={() => void copy()}>
            {copied ? 'Copied' : 'Copy'}
        </Button>
    );
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : '—');

const ApplicationApiContainer = () => {
    const { data, mutate } = useApplicationApiKeys();
    const [confirm, setConfirm] = useState<string>();
    const [revoking, setRevoking] = useState(false);

    if (!data) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const revoke = async () => {
        if (!confirm) {
            return;
        }

        setRevoking(true);

        try {
            await revokeApplicationApiKey(confirm);
            toast.success('API key revoked.');
            await mutate();
            setConfirm(undefined);
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to revoke the key.'));
        } finally {
            setRevoking(false);
        }
    };

    return (
        <PageContentBlock title='Application API'>
            <MainPageHeader direction='column' title='Application API'>
                <p className='text-sm text-neutral-400'>
                    Control access credentials for managing this panel via the API.
                </p>
            </MainPageHeader>

            <div className='mb-4 flex justify-end'>
                <Button asChild>
                    <Link to='/api/new'>Create Credentials</Link>
                </Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-400'>
                            <th className='px-4 py-3'>Key</th>
                            <th className='px-4 py-3'>Description</th>
                            <th className='px-4 py-3'>Last Used</th>
                            <th className='px-4 py-3'>Created</th>
                            <th className='px-4 py-3' />
                        </tr>
                    </thead>
                    <tbody>
                        {data.data.map((key) => (
                            <tr key={key.identifier} className='border-b border-mocha-400/40'>
                                <td className='px-4 py-3'>
                                    <div className='flex items-center gap-2'>
                                        <code className='text-xs text-cream-100'>{key.key}</code>
                                        <CopyButton value={key.key} />
                                    </div>
                                </td>
                                <td className='px-4 py-3 text-cream-400/70'>{key.memo || '—'}</td>
                                <td className='px-4 py-3 text-cream-400/70'>{formatDate(key.last_used_at)}</td>
                                <td className='px-4 py-3 text-cream-400/70'>{formatDate(key.created_at)}</td>
                                <td className='px-4 py-3 text-right'>
                                    <Button variant='attention' size='sm' onClick={() => setConfirm(key.identifier)}>
                                        Revoke
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {data.data.length === 0 && (
                            <tr>
                                <td colSpan={5} className='px-4 py-8 text-center text-cream-400/50'>
                                    You have not created any application API keys.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog.Confirm
                open={!!confirm}
                title='Revoke API Key'
                confirm='Revoke'
                loading={revoking}
                onClose={() => setConfirm(undefined)}
                onConfirmed={revoke}
            >
                Once this API key is revoked any applications currently using it will stop working.
            </Dialog.Confirm>
        </PageContentBlock>
    );
};

export default ApplicationApiContainer;
