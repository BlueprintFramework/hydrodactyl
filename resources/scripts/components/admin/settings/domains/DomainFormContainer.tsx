import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
    type AtprotoSession,
    createDomain,
    type Domain,
    type DomainProvider,
    deleteDomain,
    getAtprotoSessions,
    type ProviderSchema,
    testDomainConnection,
    updateDomain,
} from '@/api/admin/domains';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { useDomains, useProviderSchema } from '@/api/admin/useDomains';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Dialog } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

const labelFor = (key: string) =>
    key
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const mergeConfig = (schema: ProviderSchema | undefined, config: Record<string, string>) =>
    Object.fromEntries(Object.entries(schema ?? {}).map(([key, field]) => [key, config[key] ?? field.default ?? '']));

interface Props {
    providers: Record<string, DomainProvider>;
    domain?: Domain;
    onSaved: () => void;
}

const DomainForm = ({ providers, domain, onSaved }: Props) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [name, setName] = useState(domain?.name ?? '');
    const [provider, setProvider] = useState(domain?.dns_provider ?? Object.keys(providers)[0] ?? '');
    const [config, setConfig] = useState<Record<string, string>>(domain?.dns_config ?? {});
    const [isActive, setIsActive] = useState(domain?.is_active ?? true);
    const [isDefault, setIsDefault] = useState(domain?.is_default ?? false);
    const [submitting, setSubmitting] = useState(false);
    const [testing, setTesting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [atprotoIdentifier, setAtprotoIdentifier] = useState('');
    const [atprotoSessions, setAtprotoSessions] = useState<AtprotoSession[]>([]);

    const { data: schema } = useProviderSchema(provider);
    const isMarque = provider === 'marque';

    // Pick up the results of the AT Protocol OAuth connect round-trip.
    useEffect(() => {
        const session = searchParams.get('atproto_session');
        const error = searchParams.get('atproto_error');

        if (session) {
            setConfig((current) => ({ ...current, session_id: session }));
            toast.success(t('admin.settings.atproto_connected'));
        }

        if (error) {
            toast.error(error);
        }

        if (session || error) {
            const next = new URLSearchParams(searchParams);
            next.delete('atproto_session');
            next.delete('atproto_error');
            setSearchParams(next, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        if (!isMarque) {
            return;
        }

        getAtprotoSessions()
            .then(setAtprotoSessions)
            .catch(() => setAtprotoSessions([]));
    }, [isMarque]);

    const payload = () => ({
        name,
        dns_provider: provider,
        dns_config: mergeConfig(schema, config),
        is_active: isActive,
        is_default: isDefault,
    });

    const save = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            if (domain) {
                await updateDomain(domain.id, payload());
                await onSaved();
                toast.success(t('admin.settings.domain_updated'));
            } else {
                const created = await createDomain(payload());
                await onSaved();
                toast.success(t('admin.settings.domain_created'));
                navigate(`/settings/domains/${created.id}`);
            }
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.settings.domain_save_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    const test = async () => {
        setTesting(true);

        try {
            await testDomainConnection({ dns_provider: provider, dns_config: mergeConfig(schema, config) });
            toast.success(t('admin.settings.connection_successful'));
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.buckets.connection_failed')));
        } finally {
            setTesting(false);
        }
    };

    const connectAtproto = () => {
        const identifier = atprotoIdentifier.trim();
        if (!identifier) {
            toast.error(t('admin.settings.atproto_required'));
            return;
        }

        const returnUrl = `${window.location.pathname}${window.location.search}`;
        const query = new URLSearchParams({ identifier, return: returnUrl });
        window.location.href = `/admin/settings/domains/connect/atproto?${query.toString()}`;
    };

    const remove = async () => {
        if (!domain) {
            return;
        }

        setDeleting(true);

        try {
            await deleteDomain(domain.id);
            await onSaved();
            toast.success(t('admin.settings.domain_deleted'));
            navigate('/settings/domains');
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.settings.domain_delete_failed')));
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div className='space-y-4'>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void save();
                }}
                className='space-y-4'
            >
                <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <Field label={t('admin.settings.domain_name')} error={errors.name}>
                            <Input.Text
                                autoComplete='off'
                                placeholder='example.com'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </Field>
                        <Field label={t('admin.settings.dns_provider')} error={errors.dns_provider}>
                            <Dropdown
                                value={provider}
                                onChange={(value) => {
                                    setProvider(value);
                                    setConfig({});
                                }}
                                options={Object.entries(providers).map(([value, item]) => ({
                                    value,
                                    label: item.name.charAt(0).toUpperCase() + item.name.slice(1),
                                    description: item.description !== item.name ? item.description : undefined,
                                }))}
                            />
                        </Field>
                    </div>
                </div>

                <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>{t('admin.settings.provider_config')}</h2>
                    {errors.dns_config && <p className='text-xs text-brand-600'>{errors.dns_config}</p>}

                    {isMarque ? (
                        <div className='space-y-4'>
                            <Field
                                label={t('admin.settings.atproto_account')}
                                hint={t('admin.settings.atproto_account_hint')}
                                error={errors['dns_config.session_id']}
                            >
                                <Dropdown
                                    value={config.session_id ?? ''}
                                    onChange={(value) => setConfig({ ...config, session_id: value })}
                                    placeholder={t('admin.settings.no_account_connected')}
                                    options={atprotoSessions.map((session) => ({
                                        value: session.id,
                                        label: session.handle ?? session.did,
                                        description: session.did,
                                    }))}
                                />
                            </Field>
                            <div className='grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center'>
                                <Field
                                    label={t('admin.settings.connect_new_account')}
                                    hint={t('admin.settings.connect_new_account_hint')}
                                >
                                    <Input.Text
                                        autoComplete='off'
                                        placeholder='you.bsky.social'
                                        value={atprotoIdentifier}
                                        onChange={(e) => setAtprotoIdentifier(e.target.value)}
                                    />
                                </Field>
                                <Button type='button' variant='secondary' onClick={connectAtproto}>
                                    {t('admin.settings.connect_atproto')}
                                </Button>
                            </div>

                            <div className='space-y-4 border-t border-mocha-400 pt-4'>
                                <p className='text-xs text-cream-400/60'>{t('admin.settings.app_password_notice')}</p>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <Field
                                        label={t('admin.settings.handle_or_did')}
                                        error={errors['dns_config.identifier']}
                                    >
                                        <Input.Text
                                            autoComplete='off'
                                            placeholder='you.bsky.social'
                                            value={config.identifier ?? ''}
                                            onChange={(e) => setConfig({ ...config, identifier: e.target.value })}
                                        />
                                    </Field>
                                    <Field
                                        label={t('admin.settings.app_password')}
                                        error={errors['dns_config.app_password']}
                                    >
                                        <Input.Text
                                            type='password'
                                            autoComplete='off'
                                            value={config.app_password ?? ''}
                                            onChange={(e) => setConfig({ ...config, app_password: e.target.value })}
                                        />
                                    </Field>
                                    <Field
                                        label={t('admin.settings.pds_url')}
                                        hint={t('admin.settings.pds_url_hint')}
                                        error={errors['dns_config.pds_url']}
                                    >
                                        <Input.Text
                                            autoComplete='off'
                                            placeholder='https://bsky.social'
                                            value={config.pds_url ?? ''}
                                            onChange={(e) => setConfig({ ...config, pds_url: e.target.value })}
                                        />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {Object.entries(schema ?? {}).map(([key, field]) => (
                                <Field
                                    key={key}
                                    label={field.label ?? labelFor(key)}
                                    hint={field.description}
                                    error={errors[`dns_config.${key}`]}
                                >
                                    <Input.Text
                                        type={field.sensitive ? 'password' : 'text'}
                                        autoComplete='off'
                                        value={config[key] ?? field.default ?? ''}
                                        onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                                    />
                                </Field>
                            ))}
                            {schema && Object.keys(schema).length === 0 && (
                                <p className='text-xs text-cream-400/60'>{t('admin.settings.no_provider_options')}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <Button type='button' variant='secondary' onClick={test} disabled={testing}>
                            {t('admin.buckets.test_connection')}
                        </Button>
                    </div>
                </div>

                <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <Field label={t('admin.common.status')} error={errors.is_active}>
                            <Dropdown
                                value={isActive ? 'true' : 'false'}
                                onChange={(value) => setIsActive(value === 'true')}
                                options={[
                                    { value: 'true', label: t('common.active') },
                                    { value: 'false', label: t('common.inactive') },
                                ]}
                            />
                        </Field>
                        <Field
                            label={t('admin.settings.default_domain')}
                            error={errors.is_default}
                            hint={t('admin.settings.default_domain_hint')}
                        >
                            <Dropdown
                                value={isDefault ? 'true' : 'false'}
                                onChange={(value) => setIsDefault(value === 'true')}
                                options={[
                                    { value: 'false', label: t('common.no') },
                                    { value: 'true', label: t('common.yes') },
                                ]}
                            />
                        </Field>
                    </div>
                </div>

                <div className='flex justify-end gap-2'>
                    <Button
                        type='button'
                        variant='secondary'
                        onClick={() => navigate('/settings/domains')}
                        disabled={submitting}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button type='submit' disabled={submitting}>
                        {domain ? t('admin.settings.update_domain') : t('admin.settings.create_domain')}
                    </Button>
                </div>
            </form>

            {domain && (
                <div className='rounded-xl border border-brand-400/40 bg-brand-400/5 p-4'>
                    <h2 className='text-sm font-semibold text-brand-400'>{t('admin.settings.delete_domain')}</h2>
                    <p className='mt-1 text-sm text-cream-400/70'>{t('admin.settings.delete_domain_description')}</p>
                    <Button
                        variant='attention'
                        className='mt-3'
                        disabled={domain.active_subdomains_count > 0}
                        onClick={() => setConfirmDelete(true)}
                    >
                        {t('admin.settings.delete_domain')}
                    </Button>
                </div>
            )}

            <Dialog.Confirm
                open={confirmDelete}
                title={t('admin.settings.delete_domain')}
                confirm={t('common.delete')}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={remove}
                loading={deleting}
            >
                {t('admin.settings.delete_domain_confirm')}
            </Dialog.Confirm>
        </div>
    );
};

const DomainFormContainer = () => {
    const { t } = useTranslation();
    const { id } = useParams<'id'>();
    const { data, mutate } = useDomains();

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const domain = id ? data.data.find((item) => item.id === Number(id)) : undefined;

    if (id && !domain) {
        return (
            <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-8 text-center text-sm text-cream-400/60'>
                {t('admin.settings.domain_not_found')}
            </div>
        );
    }

    return <DomainForm key={domain?.id ?? 'new'} providers={data.providers} domain={domain} onSaved={mutate} />;
};

export default DomainFormContainer;
