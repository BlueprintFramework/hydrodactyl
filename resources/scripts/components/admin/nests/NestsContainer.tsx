import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { type AdminNest, importEgg, importEggFromUrl } from '@/api/admin/nests';
import { useNests } from '@/api/admin/useNests';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Dialog } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const nestOptions = (nests: AdminNest[]) =>
    nests.map((nest) => ({ value: String(nest.id), label: `${nest.name} <${nest.author}>` }));

const ImportEggDialog = ({ open, onClose, nests }: { open: boolean; onClose: () => void; nests: AdminNest[] }) => {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [nestId, setNestId] = useState(nests[0] ? String(nests[0].id) : '');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const close = () => {
        if (!submitting) {
            onClose();
        }
    };

    const submit = async () => {
        setErrors({});

        if (!file) {
            setErrors({ import_file: 'Please choose a file to import.' });
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('import_file', file);
            formData.append('import_to_nest', nestId);

            const egg = await importEgg(formData);
            toast.success('Egg imported.');
            onClose();
            navigate(`/eggs/${egg.id}`);
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to import the egg.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} title='Import Egg' onClose={close} preventExternalClose={submitting}>
            <div className='mt-4'>
                <form
                    id='import-egg-form'
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                    className='flex flex-col gap-4'
                >
                    <Field label='Egg File' error={errors.import_file} hint='A JSON egg export file.'>
                        <input
                            type='file'
                            accept='application/json'
                            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                            className='w-full text-sm text-cream-100'
                        />
                    </Field>
                    <Field label='Associated Nest' error={errors.import_to_nest}>
                        <Dropdown
                            value={nestId}
                            onChange={setNestId}
                            placeholder='Select a nest…'
                            options={nestOptions(nests)}
                        />
                    </Field>
                    <Dialog.Footer>
                        <Button type='button' variant='secondary' onClick={close} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type='submit' form='import-egg-form' disabled={submitting}>
                            Import
                        </Button>
                    </Dialog.Footer>
                </form>
            </div>
        </Dialog>
    );
};

const ImportEggFromUrlDialog = ({
    open,
    onClose,
    nests,
}: {
    open: boolean;
    onClose: () => void;
    nests: AdminNest[];
}) => {
    const navigate = useNavigate();
    const [url, setUrl] = useState('');
    const [nestId, setNestId] = useState(nests[0] ? String(nests[0].id) : '');
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
            const egg = await importEggFromUrl({ import_file_url: url, import_to_nest: Number(nestId) });
            toast.success('Egg imported.');
            onClose();
            navigate(`/eggs/${egg.id}`);
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to import the egg.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} title='Import Egg from URL' onClose={close} preventExternalClose={submitting}>
            <div className='mt-4'>
                <form
                    id='import-egg-url-form'
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                    className='flex flex-col gap-4'
                >
                    <Field label='Egg URL' error={errors.import_file_url} hint='A direct link to a JSON egg file.'>
                        <Input.Text
                            value={url}
                            placeholder='https://example.com/egg.json'
                            onChange={(event) => setUrl(event.target.value)}
                        />
                    </Field>
                    <Field label='Associated Nest' error={errors.import_to_nest}>
                        <Dropdown
                            value={nestId}
                            onChange={setNestId}
                            placeholder='Select a nest…'
                            options={nestOptions(nests)}
                        />
                    </Field>
                    <Dialog.Footer>
                        <Button type='button' variant='secondary' onClick={close} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type='submit' form='import-egg-url-form' disabled={submitting}>
                            Import
                        </Button>
                    </Dialog.Footer>
                </form>
            </div>
        </Dialog>
    );
};

const NestsContainer = () => {
    const { data } = useNests();
    const [importOpen, setImportOpen] = useState(false);
    const [importUrlOpen, setImportUrlOpen] = useState(false);

    if (!data) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <PageContentBlock title='Nests'>
            <MainPageHeader direction='column' title='Nests'>
                <p className='text-sm text-neutral-400'>All nests currently available on this system.</p>
            </MainPageHeader>

            <div className='mb-4 flex flex-wrap justify-end gap-2'>
                <Button variant='secondary' onClick={() => setImportOpen(true)}>
                    Import Egg
                </Button>
                <Button variant='secondary' onClick={() => setImportUrlOpen(true)}>
                    Import Egg from URL
                </Button>
                <Button asChild>
                    <Link to='/nests/new'>Create New</Link>
                </Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-400'>
                            <th className='px-4 py-3'>ID</th>
                            <th className='px-4 py-3'>Name</th>
                            <th className='px-4 py-3'>Description</th>
                            <th className='px-4 py-3 text-center'>Eggs</th>
                            <th className='px-4 py-3 text-center'>Servers</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((nest) => (
                            <tr key={nest.id} className='border-b border-mocha-400/40 hover:bg-mocha-400/20'>
                                <td className='px-4 py-3 font-mono text-cream-400/60'>{nest.id}</td>
                                <td className='px-4 py-3'>
                                    <Link to={`/nests/${nest.id}`} className='text-cream-50 hover:text-hydro-400'>
                                        {nest.name}
                                    </Link>
                                </td>
                                <td className='px-4 py-3 text-cream-400/70'>{nest.description || '—'}</td>
                                <td className='px-4 py-3 text-center text-cream-100'>{nest.eggs_count}</td>
                                <td className='px-4 py-3 text-center text-cream-100'>{nest.servers_count}</td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={5} className='px-4 py-8 text-center text-cream-400/50'>
                                    No nests have been created.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ImportEggDialog open={importOpen} onClose={() => setImportOpen(false)} nests={data} />
            <ImportEggFromUrlDialog open={importUrlOpen} onClose={() => setImportUrlOpen(false)} nests={data} />
        </PageContentBlock>
    );
};

export default NestsContainer;
