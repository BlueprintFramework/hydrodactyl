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
            toast.success('Location created.');
            setShort('');
            setLong('');
            onCreated(location);
            onClose();
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to create location.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} title='Create Location' onClose={close} preventExternalClose={submitting}>
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
                        label='Short Code'
                        error={errors.short}
                        hint='A short identifier used to distinguish this location, e.g. us.nyc.lvl3.'
                    >
                        <Input.Text value={short} onChange={(event) => setShort(event.target.value)} />
                    </Field>
                    <Field label='Description' error={errors.long} hint='Optional. Must be less than 191 characters.'>
                        <Input.Text value={long} onChange={(event) => setLong(event.target.value)} />
                    </Field>
                    <Dialog.Footer>
                        <Button type='button' variant='secondary' onClick={close} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type='submit' form='create-location-form' disabled={submitting}>
                            Create
                        </Button>
                    </Dialog.Footer>
                </form>
            </div>
        </Dialog>
    );
};

const LocationsContainer = () => {
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
        <PageContentBlock title='Locations'>
            <MainPageHeader direction='column' title='Locations'>
                <p className='text-sm text-neutral-400'>
                    All locations that nodes can be assigned to for easier categorization.
                </p>
            </MainPageHeader>

            <div className='mb-4 flex justify-end'>
                <Button onClick={() => setCreateOpen(true)}>Create Location</Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-400'>
                            <th className='px-4 py-3'>ID</th>
                            <th className='px-4 py-3'>Short Code</th>
                            <th className='px-4 py-3'>Description</th>
                            <th className='px-4 py-3 text-center'>Memory Alloc%</th>
                            <th className='px-4 py-3 text-center'>Disk Alloc%</th>
                            <th className='px-4 py-3 text-center'>Nodes</th>
                            <th className='px-4 py-3 text-center'>Servers</th>
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
                                        title={`Allocated: ${formatMib(location.allocated_memory)} / Total: ${formatMib(location.total_memory)}`}
                                    >
                                        {location.memory_percent}%
                                    </span>
                                </td>
                                <td className='px-4 py-3 text-center'>
                                    <span
                                        className={cn(percentColor(location.disk_percent))}
                                        title={`Allocated: ${formatMib(location.allocated_disk)} / Total: ${formatMib(location.total_disk)}`}
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
                                    No locations have been created.
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
