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

const ResourceBar = ({ title, usage }: { title: string; usage: LocationUsage }) => (
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
            <span className='text-cream-100'>{formatMib(usage.allocated)}</span> of {formatMib(usage.total)} allocated
        </p>
    </div>
);

const LocationDetails = ({ location, onSaved }: { location: AdminLocationDetail; onSaved: () => Promise<unknown> }) => {
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
            toast.success('Location updated.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to update location.'));
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async () => {
        setDeleting(true);

        try {
            await deleteLocation(location.id);
            toast.success('Location deleted.');
            navigate('/locations');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete location.'));
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div className='flex flex-col gap-4'>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <div className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>Location Details</h2>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void save();
                        }}
                        className='flex flex-col gap-4'
                    >
                        <Field label='Short Code' error={errors.short}>
                            <Input.Text value={short} onChange={(event) => setShort(event.target.value)} />
                        </Field>
                        <Field label='Description' error={errors.long}>
                            <Input.Text value={long} onChange={(event) => setLong(event.target.value)} />
                        </Field>
                        <div className='flex justify-end'>
                            <Button type='submit' disabled={submitting}>
                                Save
                            </Button>
                        </div>
                    </form>
                </div>

                <div className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>Resource Allocation</h2>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        <ResourceBar title='Memory' usage={location.memory} />
                        <ResourceBar title='Disk' usage={location.disk} />
                    </div>
                </div>
            </div>

            <div className='overflow-hidden rounded-xl border border-mocha-400'>
                <div className='border-b border-mocha-400 px-4 py-3'>
                    <h2 className='text-sm font-semibold text-cream-50'>Nodes</h2>
                </div>
                <div className='overflow-x-auto'>
                    <table className='w-full text-sm'>
                        <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                            <tr className='border-b border-mocha-400'>
                                <th className='px-4 py-3'>ID</th>
                                <th className='px-4 py-3'>Name</th>
                                <th className='px-4 py-3'>FQDN</th>
                                <th className='px-4 py-3 text-center'>Memory</th>
                                <th className='px-4 py-3 text-center'>Disk</th>
                                <th className='px-4 py-3 text-center'>Servers</th>
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
                                        No nodes are assigned to this location.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className='rounded-xl border border-brand-400/40 bg-brand-400/5 p-4'>
                <h2 className='text-sm font-semibold text-brand-400'>Delete Location</h2>
                <p className='mt-1 text-sm text-cream-400/70'>
                    A location must have no nodes before it can be deleted.
                </p>
                <Button
                    variant='attention'
                    className='mt-3'
                    disabled={location.nodes.length > 0}
                    onClick={() => setConfirmDelete(true)}
                >
                    Delete Location
                </Button>
            </div>

            <Dialog.Confirm
                open={confirmDelete}
                title='Delete Location'
                confirm='Delete'
                loading={deleting}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={remove}
            >
                Deleting this location is permanent and cannot be undone.
            </Dialog.Confirm>
        </div>
    );
};

const LocationViewContainer = () => {
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
            <PageContentBlock title='Location'>
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-8 text-center text-sm text-cream-400/60'>
                    That location could not be found.
                </div>
            </PageContentBlock>
        );
    }

    return (
        <PageContentBlock title={location.short}>
            <MainPageHeader direction='column' title={location.short}>
                <p className='text-sm text-neutral-400'>{location.long || 'No description provided.'}</p>
            </MainPageHeader>

            <LocationDetails key={location.id} location={location} onSaved={mutate} />
        </PageContentBlock>
    );
};

export default LocationViewContainer;
