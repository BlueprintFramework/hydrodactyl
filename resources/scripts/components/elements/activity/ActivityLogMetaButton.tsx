import { Code, Copy } from '@gravity-ui/icons';
import { useState } from 'react';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

import { formatObjectToIdentString } from '@/lib/objects';

const ActivityLogMetaButton = ({ meta }: { meta: Record<string, unknown> }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(meta, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy metadata:', err);
        }
    };

    const metadataString = formatObjectToIdentString(meta);
    const metadataJson = JSON.stringify(meta, null, 2);

    return (
        <>
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                hideCloseIcon
                title={t('server.activity.event_metadata')}
            >
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <h4 className='text-sm font-medium text-zinc-300'>{t('server.activity.formatted_view')}</h4>
                        <Button
                            variant='secondary'
                            onClick={copyToClipboard}
                            className='flex items-center gap-2 text-xs'
                        >
                            <Copy width={22} height={22} />
                            {copied ? t('server.activity.copied') : t('server.activity.copy_json')}
                        </Button>
                    </div>

                    <div className='bg-zinc-900 rounded-lg p-4 border border-zinc-800 max-h-96 overflow-auto'>
                        <pre className='font-mono text-sm leading-relaxed whitespace-pre-wrap text-zinc-300'>
                            {metadataString}
                        </pre>
                    </div>

                    <div>
                        <h4 className='text-sm font-medium text-zinc-300 mb-2'>{t('server.activity.raw_json')}</h4>
                        <div className='bg-zinc-900 rounded-lg p-4 border border-zinc-800 max-h-64 overflow-auto'>
                            <pre className='font-mono text-xs leading-relaxed whitespace-pre-wrap text-zinc-400'>
                                {metadataJson}
                            </pre>
                        </div>
                    </div>
                </div>

                <Dialog.Footer>
                    <Button variant='secondary' onClick={() => setOpen(false)}>
                        {t('common.close')}
                    </Button>
                </Dialog.Footer>
            </Dialog>

            <button
                type='button'
                aria-label={t('server.activity.view_metadata')}
                className='w-6 h-6 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors duration-150 flex items-center justify-center'
                onClick={() => setOpen(true)}
            >
                <Code width={22} height={22} />
            </button>
        </>
    );
};

export default ActivityLogMetaButton;
