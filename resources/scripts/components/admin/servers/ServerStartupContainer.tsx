import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { type EggSummary, type NestSummary, type ServerStartupData, updateServerStartup } from '@/api/admin/servers';
import { useServer, useServerStartup } from '@/api/admin/useServers';
import { Field } from '@/components/admin/Field';
import { Checkbox } from '@/components/elements/CheckboxNew';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

const cardClass = 'flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4';

const allEggs = (nests: NestSummary[]) => nests.flatMap((nest) => nest.eggs);

const findEgg = (nests: NestSummary[], eggId: number | string) =>
    allEggs(nests).find((egg) => String(egg.id) === String(eggId));

const resolveImage = (egg: EggSummary | undefined, serverImage: string) => {
    const images = egg ? Object.values(egg.docker_images) : [];

    if (egg && images.includes(serverImage)) {
        return { dockerImage: serverImage, custom: '' };
    }

    if (egg && serverImage && !images.includes(serverImage)) {
        return { dockerImage: images[0] ?? '', custom: serverImage };
    }

    return { dockerImage: images[0] ?? '', custom: '' };
};

const ServerStartupForm = ({
    serverId,
    data,
    onSaved,
}: {
    serverId: number;
    data: ServerStartupData;
    onSaved: () => Promise<unknown>;
}) => {
    const { t } = useTranslation();
    const { server, nests, variables } = data;
    const initial = resolveImage(findEgg(nests, server.egg_id), server.image);

    const [startup, setStartup] = useState(server.startup);
    const [nestId, setNestId] = useState(String(server.nest_id));
    const [eggId, setEggId] = useState(String(server.egg_id));
    const [skipScripts, setSkipScripts] = useState(server.skip_scripts);
    const [dockerImage, setDockerImage] = useState(initial.dockerImage);
    const [customDockerImage, setCustomDockerImage] = useState(initial.custom);
    const [environment, setEnvironment] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const selectedNest = nests.find((nest) => String(nest.id) === nestId);
    const selectedEgg = findEgg(nests, eggId);
    const defaultStartup = selectedEgg?.startup ?? '';
    const dockerOptions = Object.entries(selectedEgg?.docker_images ?? {}).map(([label, image]) => ({
        value: image,
        label: `${label} (${image})`,
    }));

    const changeEgg = (value: string) => {
        setEggId(value);
        const resolved = resolveImage(findEgg(nests, value), server.image);
        setDockerImage(resolved.dockerImage);
        setCustomDockerImage(resolved.custom);
    };

    const changeNest = (value: string) => {
        setNestId(value);

        const nest = nests.find((item) => String(item.id) === value);
        const first = nest?.eggs[0];

        if (first) {
            changeEgg(String(first.id));
        } else {
            setEggId('');
            setDockerImage('');
            setCustomDockerImage('');
        }
    };

    const valueFor = (env: string, fallback: string) => environment[env] ?? variables[env] ?? fallback;

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        const env: Record<string, string> = {};
        for (const variable of selectedEgg?.variables ?? []) {
            env[variable.env_variable] = valueFor(variable.env_variable, variable.default_value ?? '');
        }

        try {
            await updateServerStartup(serverId, {
                startup,
                nest_id: Number(nestId),
                egg_id: Number(eggId),
                skip_scripts: skipScripts,
                docker_image: customDockerImage.trim() || dockerImage,
                environment: env,
            });
            await onSaved();
            toast.success(t('admin.servers.startup_updated'));
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.servers.startup_update_failed')));
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
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.servers.startup_mod_title')}</h2>
                <Field
                    label={t('admin.servers.startup_command')}
                    error={errors.startup}
                    hint={t('admin.servers.startup_hint_default')}
                >
                    <Input.Text value={startup} onChange={(event) => setStartup(event.target.value)} />
                </Field>
                <Field label={t('admin.servers.default_startup')} hint={t('admin.servers.default_startup_hint')}>
                    <Input.Text readOnly className='opacity-70' value={defaultStartup} />
                </Field>
                <div className='flex justify-end'>
                    <Button type='submit' disabled={submitting}>
                        {t('admin.servers.save_modifications')}
                    </Button>
                </div>
            </div>

            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <div className='flex flex-col gap-4'>
                    <div className={cardClass}>
                        <h2 className='text-sm font-semibold text-cream-50'>
                            {t('admin.servers.service_configuration')}
                        </h2>
                        <p className='text-xs text-brand-400'>{t('admin.servers.service_warning')}</p>
                        <Field
                            label={t('admin.servers.nest')}
                            error={errors.nest_id}
                            hint={t('admin.servers.nest_hint')}
                        >
                            <Dropdown
                                value={nestId}
                                onChange={changeNest}
                                options={nests.map((nest) => ({ value: String(nest.id), label: nest.name }))}
                            />
                        </Field>
                        <Field label={t('admin.servers.egg')} error={errors.egg_id} hint={t('admin.servers.egg_hint')}>
                            <Dropdown
                                value={eggId}
                                onChange={changeEgg}
                                placeholder={t('admin.servers.select_egg')}
                                options={(selectedNest?.eggs ?? []).map((egg) => ({
                                    value: String(egg.id),
                                    label: egg.name,
                                }))}
                            />
                        </Field>
                        <div className='flex items-center gap-2'>
                            <Checkbox
                                checked={skipScripts}
                                onCheckedChange={(checked) => setSkipScripts(checked === true)}
                            />
                            <span className='text-sm text-cream-100'>{t('admin.servers.skip_script')}</span>
                        </div>
                        <p className='text-xs text-cream-400/60'>{t('admin.servers.skip_script_hint')}</p>
                    </div>

                    <div className={cardClass}>
                        <h2 className='text-sm font-semibold text-cream-50'>
                            {t('admin.servers.docker_config_title')}
                        </h2>
                        <Field
                            label={t('admin.servers.image')}
                            error={errors.docker_image}
                            hint={t('admin.servers.image_hint')}
                        >
                            <Dropdown
                                value={dockerImage}
                                onChange={setDockerImage}
                                placeholder={t('admin.servers.select_image')}
                                options={dockerOptions}
                            />
                        </Field>
                        <Field
                            label={t('admin.servers.custom_image')}
                            error={errors.custom_docker_image}
                            hint={t('admin.servers.custom_image_hint_startup')}
                        >
                            <Input.Text
                                value={customDockerImage}
                                placeholder={t('admin.servers.custom_image_placeholder')}
                                onChange={(event) => setCustomDockerImage(event.target.value)}
                            />
                        </Field>
                    </div>
                </div>

                <div className='flex flex-col gap-4'>
                    {(selectedEgg?.variables ?? []).map((variable) => (
                        <div key={variable.env_variable} className={cardClass}>
                            <h3 className='text-sm font-semibold text-cream-50'>
                                {variable.required && (
                                    <span className='mr-2 rounded-full bg-brand-400/20 px-2 py-0.5 text-[10px] uppercase text-brand-400'>
                                        {t('admin.servers.required_badge')}
                                    </span>
                                )}
                                {variable.name}
                            </h3>
                            <Input.Text
                                value={valueFor(variable.env_variable, variable.default_value ?? '')}
                                onChange={(event) =>
                                    setEnvironment((current) => ({
                                        ...current,
                                        [variable.env_variable]: event.target.value,
                                    }))
                                }
                            />
                            {variable.description && (
                                <p className='text-xs text-cream-400/60'>{variable.description}</p>
                            )}
                            <div className='text-xs text-cream-400/60'>
                                <p>
                                    {t('admin.servers.startup_var_label')}{' '}
                                    <code className='text-cream-100'>{variable.env_variable}</code>
                                </p>
                                <p>
                                    {t('admin.servers.input_rules')}{' '}
                                    <code className='text-cream-100'>{variable.rules}</code>
                                </p>
                            </div>
                        </div>
                    ))}

                    {(selectedEgg?.variables ?? []).length === 0 && (
                        <div className={cardClass}>
                            <p className='text-sm text-cream-400/50'>{t('admin.servers.no_variables')}</p>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
};

const ServerStartupContainer = () => {
    const { id } = useParams<'id'>();
    const { data: startup, mutate } = useServerStartup(id);
    const { mutate: mutateServer } = useServer(id);

    if (!startup) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <ServerStartupForm
            key={String(id)}
            serverId={Number(id)}
            data={startup}
            onSaved={async () => {
                await Promise.all([mutate(), mutateServer()]);
            }}
        />
    );
};

export default ServerStartupContainer;
