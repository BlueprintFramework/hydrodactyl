import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { type AdminLocationDetail, deleteLocation, type LocationUsage, updateLocation } from '@/api/admin/locations';
import { useLocation } from '@/api/admin/useLocations';
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

const barColor = (percent: number) =>
    percent >= 70 ? 'bg-brand-600' : percent >= 50 ? 'bg-brand-400' : 'bg-hydro-500';

const ResourceBar = ({ title, usage }: { title: string; usage: LocationUsage }) => {
    const { t } = useTranslation();

    return (
        <div>
            <div className='flex items-center justify-between'>
                <h4 className='text-sm font-semibold text-cream-50'>{title}</h4>
                <span className='text-sm text-cream-400/70'>{usage.percent}%</span>
            </div>
            <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-mocha-400'>
                <div
                    className={cn('h-full rounded-full', barColor(usage.percent))}
                    style={{ width: `${Math.min(100, usage.percent)}%` }}
                />
            </div>
            <p className='mt-2 text-xs text-cream-400/60'>
                {t('admin.locations.of_allocated', {
                    used: formatMib(usage.allocated),
                    total: formatMib(usage.total),
                })}
            </p>
        </div>
    );
};

const LocationDetails = ({ location, onSaved }: { location: AdminLocationDetail; onSaved: () => Promise<unknown> }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [short, setShort] = useState(location.short);
    const [long, setLong] = useState(location.long ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const save = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateLocation(location.id, { short, long });
            await onSaved();
            toast.success(t('admin.locations.updated'));
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.locations.update_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async () => {
        setDeleting(true);

        try {
            await deleteLocation(location.id);
            toast.success(t('admin.locations.deleted'));
            navigate('/locations');
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.locations.delete_failed')));
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div className='flex flex-col gap-4'>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <div className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.locations.details')}</h2>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void save();
                        }}
                        className='flex flex-col gap-4'
                    >
                        <Field label={t('admin.locations.short_code')} error={errors.short}>
                            <Input.Text value={short} onChange={(event) => setShort(event.target.value)} />
                        </Field>
                        <Field label={t('admin.common.description')} error={errors.long}>
                            <Input.Text value={long} onChange={(event) => setLong(event.target.value)} />
                        </Field>
                        <div className='flex justify-end'>
                            <Button type='submit' disabled={submitting}>
                                {t('common.save')}
                            </Button>
                        </div>
                    </form>
                </div>

                <div className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.locations.resource_allocation')}</h2>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        <ResourceBar title={t('admin.common.memory')} usage={location.memory} />
                        <ResourceBar title={t('admin.common.disk')} usage={location.disk} />
                    </div>
                </div>
            </div>

            <div className='overflow-hidden rounded-xl border border-mocha-400'>
                <div className='border-b border-mocha-400 px-4 py-3'>
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.common.nodes')}</h2>
                </div>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                            <tr className='border-b border-mocha-400'>
                                <th className='px-4 py-3'>{t('admin.common.id')}</th>
                                <th className='px-4 py-3'>{t('admin.common.name')}</th>
                                <th className='px-4 py-3'>{t('admin.common.fqdn')}</th>
                                <th className='px-4 py-3 text-center'>{t('admin.common.memory')}</th>
                                <th className='px-4 py-3 text-center'>{t('admin.common.disk')}</th>
                                <th className='px-4 py-3 text-center'>{t('admin.common.servers')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {location.nodes.map((node) => (
                                <tr key={node.id} className='border-b border-mocha-400/40'>
                                    <td className='px-4 py-3 font-mono text-cream-400/60'>{node.id}</td>
                                    <td className='px-4 py-3'>
                                        <Link to={`/nodes/${node.id}`} className='text-cream-50 hover:text-hydro-400'>
                                            {node.name}
                                        </Link>
                                    </td>
                                    <td className='px-4 py-3 font-mono text-cream-400/70'>{node.fqdn}</td>
                                    <td className={cn('px-4 py-3 text-center', percentColor(node.memory_percent))}>
                                        {node.memory_percent}%
                                    </td>
                                    <td className={cn('px-4 py-3 text-center', percentColor(node.disk_percent))}>
                                        {node.disk_percent}%
                                    </td>
                                    <td className='px-4 py-3 text-center text-cream-100'>{node.servers_count}</td>
                                </tr>
                            ))}
                            {location.nodes.length === 0 && (
                                <tr>
                                    <td colSpan={6} className='px-4 py-6 text-center text-cream-400/50'>
                                        {t('admin.locations.no_nodes')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='rounded-xl border border-brand-400/40 bg-brand-400/5 p-4'>
                <h2 className='text-sm font-semibold text-brand-400'>{t('admin.locations.delete')}</h2>
                <p className='mt-1 text-sm text-cream-400/70'>{t('admin.locations.delete_description')}</p>
                <Button
                    variant='attention'
                    className='mt-3'
                    disabled={location.nodes.length > 0}
                    onClick={() => setConfirmDelete(true)}
                >
                    {t('admin.locations.delete')}
                </Button>
            </div>

            <Dialog.Confirm
                open={confirmDelete}
                title={t('admin.locations.delete')}
                confirm={t('common.delete')}
                loading={deleting}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={remove}
            >
                {t('admin.locations.delete_confirm')}
            </Dialog.Confirm>
        </div>
    );
};

const LocationViewContainer = () => {
    const { t } = useTranslation();
    const { id } = useParams<'id'>();
    const { data: location, error, isLoading, mutate } = useLocation(id);

    if (isLoading) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    if (error || !location) {
        return (
            <PageContentBlock title={t('admin.locations.title')}>
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-8 text-center text-sm text-cream-400/60'>
                    {t('admin.locations.not_found')}
                </div>
            </PageContentBlock>
        );
    }

    return (
        <PageContentBlock title={location.short}>
            <MainPageHeader direction='column' title={location.short}>
                <p className='text-sm text-neutral-400'>{location.long || t('admin.locations.no_description')}</p>
            </MainPageHeader>

            <LocationDetails key={location.id} location={location} onSaved={mutate} />
        </PageContentBlock>
    );
};

export default LocationViewContainer;
