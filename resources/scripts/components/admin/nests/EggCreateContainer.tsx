import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { type AdminNest, createEgg, type EggValues } from '@/api/admin/nests';
import { useNest, useNests } from '@/api/admin/useNests';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const cardClass = 'flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4';
const textareaClass = 'w-full rounded-lg bg-[#ffffff11] px-4 py-2 text-sm text-cream-100 outline-none';

const splitFeatures = (value: string) =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const EggCreateForm = ({ nests }: { nests: AdminNest[] }) => {
    const navigate = useNavigate();

    const [nestId, setNestId] = useState(nests[0] ? String(nests[0].id) : '');
    const { data: nest } = useNest(nestId);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [forceOutgoingIp, setForceOutgoingIp] = useState('false');
    const [dockerImages, setDockerImages] = useState('');
    const [startup, setStartup] = useState('');
    const [features, setFeatures] = useState('');
    const [configFrom, setConfigFrom] = useState('');
    const [configStop, setConfigStop] = useState('');
    const [configLogs, setConfigLogs] = useState('');
    const [configFiles, setConfigFiles] = useState('');
    const [configStartup, setConfigStartup] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const configFromOptions = [
        { value: '', label: 'None' },
        ...(nest?.eggs ?? []).map((egg) => ({
            value: String(egg.id),
            label: egg.name,
            description: egg.author,
        })),
    ];

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        const payload: EggValues & { startup: string } = {
            nest_id: Number(nestId),
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
            const egg = await createEgg(payload);
            toast.success('Egg created.');
            navigate(`/eggs/${egg.id}`);
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to create the egg.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}
            className='flex flex-col gap-4'
        >
            <div className={cardClass}>
                <h2 className='text-sm font-semibold text-cream-50'>Core Details</h2>
                <Field label='Associated Nest' error={errors.nest_id} hint='The nest this egg will belong to.'>
                    <Dropdown
                        value={nestId}
                        onChange={setNestId}
                        placeholder='Select a nest…'
                        options={nests.map((item) => ({
                            value: String(item.id),
                            label: `${item.name} <${item.author}>`,
                        }))}
                    />
                </Field>
                <Field label='Name' error={errors.name}>
                    <Input.Text value={name} onChange={(event) => setName(event.target.value)} />
                </Field>
                <Field label='Description' error={errors.description}>
                    <textarea
                        className={textareaClass}
                        rows={4}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
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
                <h2 className='text-sm font-semibold text-cream-50'>Startup &amp; Docker</h2>
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
                <Field label='Startup Command' error={errors.startup}>
                    <textarea
                        className={textareaClass}
                        rows={4}
                        value={startup}
                        onChange={(event) => setStartup(event.target.value)}
                    />
                </Field>
                <Field label='Features' error={errors.features} hint='Comma-separated list of features for this egg.'>
                    <Input.Text value={features} onChange={(event) => setFeatures(event.target.value)} />
                </Field>
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

            <div className='flex flex-wrap items-center justify-end gap-4'>
                <Button type='button' variant='secondary' onClick={() => navigate('/nests')}>
                    Cancel
                </Button>
                <Button type='submit' disabled={submitting}>
                    Create Egg
                </Button>
            </div>
        </form>
    );
};

const EggCreateContainer = () => {
    const { data: nests } = useNests();

    return (
        <PageContentBlock title='New Egg'>
            <MainPageHeader direction='column' title='New Egg'>
                <p className='text-sm text-neutral-400'>Create a new Egg to assign to servers.</p>
            </MainPageHeader>

            {nests ? (
                <EggCreateForm nests={nests} />
            ) : (
                <div className='flex min-h-[60vh] items-center justify-center'>
                    <Spinner centered size={Spinner.Size.LARGE} />
                </div>
            )}
        </PageContentBlock>
    );
};

export default EggCreateContainer;
