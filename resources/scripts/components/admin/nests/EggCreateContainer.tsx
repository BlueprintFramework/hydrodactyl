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
import { useTranslation } from '@/i18n/I18nProvider';

const cardClass = 'flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4';
const textareaClass = 'w-full rounded-lg bg-[#ffffff11] px-4 py-2 text-sm text-cream-100 outline-none';

const splitFeatures = (value: string) =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const EggCreateForm = ({ nests }: { nests: AdminNest[] }) => {
    const { t } = useTranslation();
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
            toast.success(t('admin.nests.egg_created'));
            navigate(`/eggs/${egg.id}`);
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.nests.egg_create_failed')));
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
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.nests.core_details')}</h2>
                <Field
                    label={t('admin.nests.associated_nest')}
                    error={errors.nest_id}
                    hint={t('admin.nests.associated_nest_hint')}
                >
                    <Dropdown
                        value={nestId}
                        onChange={setNestId}
                        placeholder={t('admin.nests.select_nest')}
                        options={nests.map((item) => ({
                            value: String(item.id),
                            label: `${item.name} <${item.author}>`,
                        }))}
                    />
                </Field>
                <Field label={t('admin.common.name')} error={errors.name}>
                    <Input.Text value={name} onChange={(event) => setName(event.target.value)} />
                </Field>
                <Field label={t('admin.common.description')} error={errors.description}>
                    <textarea
                        className={textareaClass}
                        rows={4}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                </Field>
                <Field label={t('admin.nests.force_outgoing_ip')} error={errors.force_outgoing_ip}>
                    <Dropdown
                        value={forceOutgoingIp}
                        onChange={setForceOutgoingIp}
                        options={[
                            { value: 'true', label: t('admin.common.true') },
                            { value: 'false', label: t('admin.common.false') },
                        ]}
                    />
                </Field>
            </div>

            <div className={cardClass}>
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.nests.startup_docker')}</h2>
                <Field
                    label={t('admin.nests.docker_images')}
                    error={errors.docker_images}
                    hint={t('admin.nests.docker_images_hint')}
                >
                    <textarea
                        className={textareaClass}
                        rows={4}
                        value={dockerImages}
                        onChange={(event) => setDockerImages(event.target.value)}
                    />
                </Field>
                <Field label={t('admin.nests.startup_command')} error={errors.startup}>
                    <textarea
                        className={textareaClass}
                        rows={4}
                        value={startup}
                        onChange={(event) => setStartup(event.target.value)}
                    />
                </Field>
                <Field label={t('admin.nests.features')} error={errors.features} hint={t('admin.nests.features_hint')}>
                    <Input.Text value={features} onChange={(event) => setFeatures(event.target.value)} />
                </Field>
            </div>

            <div className={cardClass}>
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.nests.process_management')}</h2>
                <Field label={t('admin.nests.copy_settings')} error={errors.config_from}>
                    <Dropdown value={configFrom} onChange={setConfigFrom} options={configFromOptions} />
                </Field>
                <Field label={t('admin.nests.stop_command')} error={errors.config_stop}>
                    <Input.Text value={configStop} onChange={(event) => setConfigStop(event.target.value)} />
                </Field>
                <Field label={t('admin.nests.log_config')} error={errors.config_logs}>
                    <textarea
                        className={textareaClass}
                        rows={6}
                        value={configLogs}
                        onChange={(event) => setConfigLogs(event.target.value)}
                    />
                </Field>
                <Field label={t('admin.nests.config_files')} error={errors.config_files}>
                    <textarea
                        className={textareaClass}
                        rows={6}
                        value={configFiles}
                        onChange={(event) => setConfigFiles(event.target.value)}
                    />
                </Field>
                <Field label={t('admin.nests.start_config')} error={errors.config_startup}>
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
                    {t('common.cancel')}
                </Button>
                <Button type='submit' disabled={submitting}>
                    {t('admin.nests.create_egg')}
                </Button>
            </div>
        </form>
    );
};

const EggCreateContainer = () => {
    const { t } = useTranslation();
    const { data: nests } = useNests();

    return (
        <PageContentBlock title={t('admin.nests.new_egg')}>
            <MainPageHeader direction='column' title={t('admin.nests.new_egg')}>
                <p className='text-sm text-neutral-400'>{t('admin.nests.new_egg_description')}</p>
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
