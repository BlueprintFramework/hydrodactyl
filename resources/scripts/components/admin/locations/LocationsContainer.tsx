import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { type AdminLocation, createLocation } from '@/api/admin/locations';
import { useLocations } from '@/api/admin/useLocations';
import { Field } from '@/components/admin/Field';
import { Dialog } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

const formatMib = (mib: number): string => {
    if (!mib) return '0 B';

    const bytes = mib * 1024 * 1024;
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}`;
};

const percentColor = (percent: number) =>
    percent >= 70 ? 'text-brand-600' : percent >= 50 ? 'text-brand-400' : 'text-hydro-400';

const CreateLocationDialog = ({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (location: AdminLocation) => void;
}) => {
    const { t } = useTranslation();
    const [short, setShort] = useState('');
    const [long, setLong] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const close = () => {
        if (!submitting) {
            onClose();
        }
    };

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            const location = await createLocation({ short, long });
            toast.success(t('admin.locations.created'));
            setShort('');
            setLong('');
            onCreated(location);
            onClose();
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.locations.create_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} title={t('admin.locations.create')} onClose={close} preventExternalClose={submitting}>
            <div className='mt-4'>
                <form
                    id='create-location-form'
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                    className='flex flex-col gap-4'
                >
                    <Field
                        label={t('admin.locations.short_code')}
                        error={errors.short}
                        hint={t('admin.locations.short_code_hint')}
                    >
                        <Input.Text value={short} onChange={(event) => setShort(event.target.value)} />
                    </Field>
                    <Field
                        label={t('admin.common.description')}
                        error={errors.long}
                        hint={t('admin.locations.long_hint')}
                    >
                        <Input.Text value={long} onChange={(event) => setLong(event.target.value)} />
                    </Field>
                    <Dialog.Footer>
                        <Button type='button' variant='secondary' onClick={close} disabled={submitting}>
                            {t('common.cancel')}
                        </Button>
                        <Button type='submit' form='create-location-form' disabled={submitting}>
                            {t('common.create')}
                        </Button>
                    </Dialog.Footer>
                </form>
            </div>
        </Dialog>
    );
};

const LocationsContainer = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data, mutate } = useLocations();
    const [createOpen, setCreateOpen] = useState(false);

    if (!data) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <PageContentBlock title={t('admin.nav.locations')}>
            <MainPageHeader direction='column' title={t('admin.nav.locations')}>
                <p className='text-sm text-neutral-400'>{t('admin.locations.description')}</p>
            </MainPageHeader>

            <div className='mb-4 flex justify-end'>
                <Button onClick={() => setCreateOpen(true)}>{t('admin.locations.create')}</Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-400'>
                            <th className='px-4 py-3'>{t('admin.common.id')}</th>
                            <th className='px-4 py-3'>{t('admin.locations.short_code')}</th>
                            <th className='px-4 py-3'>{t('admin.common.description')}</th>
                            <th className='px-4 py-3 text-center'>{t('admin.locations.memory_alloc')}</th>
                            <th className='px-4 py-3 text-center'>{t('admin.locations.disk_alloc')}</th>
                            <th className='px-4 py-3 text-center'>{t('admin.common.nodes')}</th>
                            <th className='px-4 py-3 text-center'>{t('admin.common.servers')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((location) => (
                            <tr key={location.id} className='border-b border-mocha-400/40 hover:bg-mocha-400/20'>
                                <td className='px-4 py-3 font-mono text-cream-400/60'>{location.id}</td>
                                <td className='px-4 py-3'>
                                    <Link
                                        to={`/locations/${location.id}`}
                                        className='text-cream-50 hover:text-hydro-400'
                                    >
                                        {location.short}
                                    </Link>
                                </td>
                                <td className='px-4 py-3 text-cream-400/70'>{location.long}</td>
                                <td className='px-4 py-3 text-center'>
                                    <span
                                        className={cn(percentColor(location.memory_percent))}
                                        title={t('admin.locations.allocated_total', {
                                            allocated: formatMib(location.allocated_memory),
                                            total: formatMib(location.total_memory),
                                        })}
                                    >
                                        {location.memory_percent}%
                                    </span>
                                </td>
                                <td className='px-4 py-3 text-center'>
                                    <span
                                        className={cn(percentColor(location.disk_percent))}
                                        title={t('admin.locations.allocated_total', {
                                            allocated: formatMib(location.allocated_disk),
                                            total: formatMib(location.total_disk),
                                        })}
                                    >
                                        {location.disk_percent}%
                                    </span>
                                </td>
                                <td className='px-4 py-3 text-center text-cream-100'>{location.nodes_count}</td>
                                <td className='px-4 py-3 text-center text-cream-100'>{location.servers_count}</td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={7} className='px-4 py-8 text-center text-cream-400/50'>
                                    {t('admin.locations.empty')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <CreateLocationDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(location) => {
                    void mutate();
                    navigate(`/locations/${location.id}`);
                }}
            />
        </PageContentBlock>
    );
};

export default LocationsContainer;
