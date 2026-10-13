import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { errorToMessage } from '@/api/admin/errors';
import { type LogoResponse, updateLogo } from '@/api/admin/logo';
import { useLogo } from '@/api/admin/useLogo';
import { Dialog } from '@/components/elements/dialog';
import Logo from '@/components/elements/HydroLogo';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

const BrandingForm = ({ logo, onSaved }: { logo: LogoResponse; onSaved: () => void }) => {
    const { t } = useTranslation();
    const fileInput = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [url, setUrl] = useState('');
    const [urlPreview, setUrlPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState(false);

    const chooseFile = (selected: File) => {
        setFile(selected);
        setFilePreview(URL.createObjectURL(selected));
        setUrl('');
        setUrlPreview(null);
    };

    const save = async () => {
        if (!file && url.trim() === '') {
            toast.error(t('admin.settings.choose_file_url'));
            return;
        }

        setSubmitting(true);

        try {
            await updateLogo(file ? { logo_file: file } : { logo_url: url.trim() });
            await onSaved();
            setFile(null);
            setFilePreview(null);
            setUrl('');
            setUrlPreview(null);
            if (fileInput.current) {
                fileInput.current.value = '';
            }
            toast.success(t('admin.settings.logo_updated'));
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.settings.logo_update_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async () => {
        setRemoving(true);

        try {
            await updateLogo({ remove: true });
            await onSaved();
            toast.success(t('admin.settings.logo_removed'));
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.settings.logo_remove_failed')));
        } finally {
            setRemoving(false);
            setConfirmRemove(false);
        }
    };

    const rewind = async (index: number) => {
        try {
            await updateLogo({ rewind: index });
            await onSaved();
            toast.success(t('admin.settings.logo_restored'));
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.settings.logo_restore_failed')));
        }
    };

    return (
        <div className='space-y-4'>
            <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.settings.current_logo')}</h2>
                <div className='mt-4 flex min-h-[120px] items-center justify-center'>
                    {logo.url ? (
                        <img
                            src={logo.url}
                            alt={t('admin.settings.current_logo')}
                            className='max-h-[160px] max-w-full rounded-lg'
                        />
                    ) : (
                        <Logo className='h-20 w-20' />
                    )}
                </div>
            </div>

            <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.settings.upload_logo_title')}</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <span className='mb-1 block text-xs font-medium text-cream-400/70'>
                            {t('admin.settings.upload_logo')}
                        </span>
                        <button
                            type='button'
                            onClick={() => fileInput.current?.click()}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(event) => {
                                event.preventDefault();
                                setDragging(false);
                                const dropped = event.dataTransfer.files?.[0];
                                if (dropped) {
                                    chooseFile(dropped);
                                }
                            }}
                            className={cn(
                                'flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors',
                                dragging
                                    ? 'border-hydro-400 bg-hydro-500/10'
                                    : 'border-mocha-300 hover:border-mocha-200',
                            )}
                        >
                            <p className='text-sm text-cream-400/70'>
                                <strong className='text-cream-100'>{t('admin.settings.click_to_choose')}</strong>{' '}
                                {t('admin.settings.drag_and_drop')}
                            </p>
                            <p className='mt-1 text-xs text-cream-400/50'>{t('admin.settings.file_types')}</p>
                        </button>
                        <input
                            ref={fileInput}
                            type='file'
                            accept='image/png,image/jpeg,image/gif,image/webp,image/svg+xml'
                            className='hidden'
                            onChange={(event) => {
                                const selected = event.target.files?.[0];
                                if (selected) {
                                    chooseFile(selected);
                                }
                            }}
                        />
                        {filePreview && (
                            <div className='mt-3 text-center'>
                                <img
                                    src={filePreview}
                                    alt={t('admin.settings.preview')}
                                    className='mx-auto max-h-[150px] rounded-lg border border-mocha-300 p-1'
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <span className='mb-1 block text-xs font-medium text-cream-400/70'>
                            {t('admin.settings.or_use_url')}
                        </span>
                        <Input.Text
                            type='url'
                            placeholder='https://example.com/logo.png'
                            value={url}
                            onChange={(event) => {
                                setUrl(event.target.value);
                                setUrlPreview(null);
                            }}
                            onBlur={() => setUrlPreview(url.trim().startsWith('http') ? url.trim() : null)}
                        />
                        <p className='mt-1 text-xs text-cream-400/50'>{t('admin.settings.url_hint')}</p>
                        {urlPreview && (
                            <div className='mt-3 text-center'>
                                <img
                                    src={urlPreview}
                                    alt={t('admin.settings.preview')}
                                    className='mx-auto max-h-[150px] rounded-lg border border-mocha-300 p-1'
                                />
                            </div>
                        )}
                    </div>
                </div>
                <div className='flex justify-end gap-2'>
                    {logo.url && (
                        <Button
                            variant='attention'
                            onClick={() => setConfirmRemove(true)}
                            disabled={submitting || removing}
                        >
                            {t('admin.settings.remove_logo')}
                        </Button>
                    )}
                    <Button onClick={save} disabled={submitting}>
                        {t('admin.settings.save_logo')}
                    </Button>
                </div>
            </div>

            {logo.history.length > 0 && (
                <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.settings.logo_history')}</h2>
                    <div className='grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6'>
                        {logo.history.map((entry, index) => (
                            <button
                                key={`${entry.type}-${entry.value}`}
                                type='button'
                                onClick={() => !entry.current && rewind(index)}
                                disabled={entry.current}
                                title={entry.current ? t('admin.settings.current_logo') : t('admin.settings.use_logo')}
                                className={cn(
                                    'flex flex-col items-center gap-2 rounded-xl border p-2 transition-colors',
                                    entry.current
                                        ? 'cursor-default border-hydro-400 bg-hydro-500/10'
                                        : 'border-mocha-300 hover:border-mocha-200 hover:bg-mocha-400/30',
                                )}
                            >
                                <img
                                    src={entry.url}
                                    alt={`Logo ${index + 1}`}
                                    className='max-h-[60px] rounded'
                                    onError={(event) => {
                                        event.currentTarget.style.visibility = 'hidden';
                                    }}
                                />
                                <span
                                    className={cn(
                                        'text-[10px]',
                                        entry.current ? 'font-semibold text-hydro-400' : 'text-cream-400/50',
                                    )}
                                >
                                    {entry.current ? t('admin.settings.current') : `#${index + 1}`}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <Dialog.Confirm
                open={confirmRemove}
                title={t('admin.settings.remove_logo')}
                confirm={t('common.remove')}
                onClose={() => setConfirmRemove(false)}
                onConfirmed={remove}
                loading={removing}
            >
                {t('admin.settings.remove_confirm')}
            </Dialog.Confirm>
        </div>
    );
};

const BrandingSettings = () => {
    const { data, mutate } = useLogo();

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return <BrandingForm logo={data} onSaved={mutate} />;
};

export default BrandingSettings;
