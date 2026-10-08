import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage } from '@/api/admin/errors';
import { createDeployToken } from '@/api/admin/nodes';
import { useNodeConfiguration } from '@/api/admin/useNodes';
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

const NodeConfigurationContainer = () => {
    const { id } = useParams<'id'>();
    const { data } = useNodeConfiguration(id);
    const [token, setToken] = useState<string>();
    const [loading, setLoading] = useState(false);

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const generate = async () => {
        setLoading(true);

        try {
            setToken(await createDeployToken(id as string));
            toast.success('Token created.');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to create a token.'));
        } finally {
            setLoading(false);
        }
    };

    const command = token ? data.auto_deploy.replace('PLACEHOLDER_TOKEN', token) : undefined;

    return (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4 lg:col-span-2'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-sm font-semibold text-cream-50'>Configuration File</h2>
                    <CopyButton value={data.yaml} />
                </div>
                <pre className='mt-3 max-h-[70vh] overflow-auto rounded-lg bg-black/40 p-3 text-xs leading-relaxed text-cream-100'>
                    {data.yaml}
                </pre>
                <p className='mt-3 text-xs text-cream-400/60'>
                    Place this file in the daemon's root directory (usually{' '}
                    <code className='text-cream-100'>/etc/elytra</code>) as{' '}
                    <code className='text-cream-100'>config.yml</code>.
                </p>
            </div>

            <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                <h2 className='text-sm font-semibold text-cream-50'>Auto-Deploy</h2>
                <p className='mt-2 text-xs text-cream-400/60'>
                    Generate a command that configures the daemon on the target server in a single step.
                </p>
                <Button type='button' variant='secondary' className='mt-3' onClick={generate} disabled={loading}>
                    Generate Token
                </Button>

                {command && (
                    <div className='mt-4'>
                        <div className='flex items-center justify-between'>
                            <span className='text-xs uppercase tracking-wide text-cream-400/50'>Deploy Command</span>
                            <CopyButton value={command} />
                        </div>
                        <pre className='mt-2 overflow-auto rounded-lg bg-black/40 p-3 text-xs leading-relaxed text-cream-100'>
                            {command}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NodeConfigurationContainer;
