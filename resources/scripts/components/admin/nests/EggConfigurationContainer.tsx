import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import {
    type AdminEgg,
    deleteEgg,
    type EggOption,
    type EggValues,
    importEggUpdate,
    updateEgg,
} from '@/api/admin/nests';
import { useEgg } from '@/api/admin/useNests';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Dialog } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const cardClass = 'flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4';
const textareaClass = 'w-full rounded-lg bg-[#ffffff11] px-4 py-2 text-sm text-cream-100 outline-none';
const fileInputClass =
    'w-full rounded-lg bg-[#ffffff11] px-4 py-2 text-sm text-cream-100 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-mocha-300 file:px-3 file:py-1 file:text-xs file:text-cream-100';

const splitFeatures = (value: string) =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const EggConfigurationForm = ({ egg, options }: { egg: AdminEgg; options: EggOption[] }) => {
    const navigate = useNavigate();

    const [name, setName] = useState(egg.name);
    const [description, setDescription] = useState(egg.description ?? '');
    const [dockerImages, setDockerImages] = useState(egg.docker_images);
    const [forceOutgoingIp, setForceOutgoingIp] = useState(egg.force_outgoing_ip ? 'true' : 'false');
    const [features, setFeatures] = useState(egg.features.join(', '));
    const [startup, setStartup] = useState(egg.startup);
    const [configFrom, setConfigFrom] = useState(egg.config_from != null ? String(egg.config_from) : '');
    const [configStop, setConfigStop] = useState(egg.config_stop ?? '');
    const [configLogs, setConfigLogs] = useState(egg.config_logs ?? '');
    const [configStartup, setConfigStartup] = useState(egg.config_startup ?? '');
    const [configFiles, setConfigFiles] = useState(egg.config_files ?? '');

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        const payload: EggValues & { startup: string } = {
            name,
            description,
            docker_images: dockerImages,
            force_outgoing_ip: forceOutgoingIp === 'true',
            features: splitFeatures(features),
            startup,
            config_from: configFrom,
            config_stop: configStop,
            config_logs: configLogs,
            config_startup: configStartup,
            config_files: configFiles,
        };

        try {
            await updateEgg(egg.id, payload);
            toast.success('Egg updated.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to update the egg.'));
        } finally {
            setSubmitting(false);
        }
    };

    const submitImport = async () => {
        if (!importFile) {
            toast.error('Choose a file to import.');
            return;
        }

        setImporting(true);

        try {
            const formData = new FormData();
            formData.append('import_file', importFile);
            await importEggUpdate(egg.id, formData);
            toast.success('Egg updated from file.');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to import the egg update.'));
        } finally {
            setImporting(false);
        }
    };

    const remove = async () => {
        setDeleting(true);

        try {
            await deleteEgg(egg.id);
            toast.success('Egg deleted.');
            navigate(`/nests/${egg.nest_id}`);
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete the egg.'));
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const configFromOptions = [
        { value: '', label: 'None' },
        ...options.map((option) => ({
            value: String(option.id),
            label: option.name,
            description: option.author,
        })),
    ];

    return (
        <div className='flex flex-col gap-4'>
            <div className={cardClass}>
                <h2 className='text-sm font-semibold text-cream-50'>Update Egg</h2>
                <Field label='Egg File' hint='Import an updated egg from a JSON export file.'>
                    <input
                        type='file'
                        accept='application/json'
                        className={fileInputClass}
                        onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                    />
                </Field>
                <div className='flex justify-end'>
                    <Button type='button' onClick={submitImport} disabled={importing || !importFile}>
                        Upload &amp; Update
                    </Button>
                </div>
            </div>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                }}
                className='flex flex-col gap-4'
            >
                <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                    <div className={cardClass}>
                        <h2 className='text-sm font-semibold text-cream-50'>Core Details</h2>
                        <Field label='Nest' hint='The nest this egg is grouped into.'>
                            <Input.Text readOnly className='opacity-70' value={egg.nest?.name ?? ''} />
                        </Field>
                        <Field label='Name' error={errors.name}>
                            <Input.Text value={name} onChange={(event) => setName(event.target.value)} />
                        </Field>
                        <Field label='UUID'>
                            <Input.Text readOnly className='opacity-70' value={egg.uuid} />
                        </Field>
                        <Field label='Author'>
                            <Input.Text readOnly className='opacity-70' value={egg.author} />
                        </Field>
                        <Field
                            label='Docker Images'
                            error={errors.docker_images}
                            hint='One per line. A display name can prefix the image with name|image.'
                        >
                            <textarea
                                className={textareaClass}
                                rows={4}
                                value={dockerImages}
                                onChange={(event) => setDockerImages(event.target.value)}
                            />
                        </Field>
                        <Field label='Force Outgoing IP' error={errors.force_outgoing_ip}>
                            <Dropdown
                                value={forceOutgoingIp}
                                onChange={setForceOutgoingIp}
                                options={[
                                    { value: 'true', label: 'True' },
                                    { value: 'false', label: 'False' },
                                ]}
                            />
                        </Field>
                    </div>

                    <div className={cardClass}>
                        <h2 className='text-sm font-semibold text-cream-50'>Descriptions</h2>
                        <Field label='Description' error={errors.description}>
                            <textarea
                                className={textareaClass}
                                rows={8}
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </Field>
                        <Field label='Startup Command' error={errors.startup}>
                            <textarea
                                className={textareaClass}
                                rows={8}
                                value={startup}
                                onChange={(event) => setStartup(event.target.value)}
                            />
                        </Field>
                        <Field
                            label='Features'
                            error={errors.features}
                            hint='Comma-separated list of features for this egg.'
                        >
                            <Input.Text value={features} onChange={(event) => setFeatures(event.target.value)} />
                        </Field>
                    </div>
                </div>

                <div className={cardClass}>
                    <h2 className='text-sm font-semibold text-cream-50'>Process Management</h2>
                    <Field label='Copy Settings From' error={errors.config_from}>
                        <Dropdown value={configFrom} onChange={setConfigFrom} options={configFromOptions} />
                    </Field>
                    <Field label='Stop Command' error={errors.config_stop}>
                        <Input.Text value={configStop} onChange={(event) => setConfigStop(event.target.value)} />
                    </Field>
                    <Field label='Log Configuration' error={errors.config_logs}>
                        <textarea
                            className={textareaClass}
                            rows={6}
                            value={configLogs}
                            onChange={(event) => setConfigLogs(event.target.value)}
                        />
                    </Field>
                    <Field label='Configuration Files' error={errors.config_files}>
                        <textarea
                            className={textareaClass}
                            rows={6}
                            value={configFiles}
                            onChange={(event) => setConfigFiles(event.target.value)}
                        />
                    </Field>
                    <Field label='Start Configuration' error={errors.config_startup}>
                        <textarea
                            className={textareaClass}
                            rows={6}
                            value={configStartup}
                            onChange={(event) => setConfigStartup(event.target.value)}
                        />
                    </Field>
                </div>

                <div className='flex flex-wrap items-center justify-between gap-4'>
                    <Button type='submit' disabled={submitting}>
                        Save
                    </Button>
                    <div className='flex items-center gap-2'>
                        <Button asChild variant='secondary'>
                            <a href={`/admin/eggs/${egg.id}/export`}>Export</a>
                        </Button>
                        <Button type='button' variant='attention' onClick={() => setConfirmDelete(true)}>
                            Delete
                        </Button>
                    </div>
                </div>
            </form>

            <Dialog.Confirm
                open={confirmDelete}
                title='Delete Egg'
                confirm='Delete'
                loading={deleting}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={remove}
            >
                Deleting this egg is permanent and cannot be undone. Servers using it may become unusable.
            </Dialog.Confirm>
        </div>
    );
};

const EggConfigurationContainer = () => {
    const { id } = useParams<'id'>();
    const { data: response } = useEgg(id);

    if (!response) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return <EggConfigurationForm key={response.data.id} egg={response.data} options={response.config_from_options} />;
};

export default EggConfigurationContainer;
