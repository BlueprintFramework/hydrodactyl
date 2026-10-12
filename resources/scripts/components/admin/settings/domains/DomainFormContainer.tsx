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
            toast.success('AT Protocol account connected.');
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
                toast.success('Domain updated.');
            } else {
                const created = await createDomain(payload());
                await onSaved();
                toast.success('Domain created.');
                navigate(`/settings/domains/${created.id}`);
            }
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to save domain.'));
        } finally {
            setSubmitting(false);
        }
    };

    const test = async () => {
        setTesting(true);

        try {
            await testDomainConnection({ dns_provider: provider, dns_config: mergeConfig(schema, config) });
            toast.success('Connection successful.');
        } catch (error) {
            toast.error(errorToMessage(error, 'Connection failed.'));
        } finally {
            setTesting(false);
        }
    };

    const connectAtproto = () => {
        const identifier = atprotoIdentifier.trim();
        if (!identifier) {
            toast.error('Enter an AT Protocol handle or DID first.');
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
            toast.success('Domain deleted.');
            navigate('/settings/domains');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete domain.'));
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
                        <Field label='Domain Name' error={errors.name}>
                            <Input.Text
                                autoComplete='off'
                                placeholder='example.com'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </Field>
                        <Field label='DNS Provider' error={errors.dns_provider}>
                            <Dropdown
                                value={provider}
                                onChange={(value) => {
                                    setProvider(value);
                                    setConfig({});
                                }}
                                options={Object.entries(providers).map(([value, item]) => ({
                                    value,
                                    label: item.name.charAt(0).toUpperCase() + item.name.slice(1),
                                    description: item.description,
                                }))}
                            />
                        </Field>
                    </div>
                </div>

                <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>Provider Configuration</h2>
                    {errors.dns_config && <p className='text-xs text-brand-600'>{errors.dns_config}</p>}

                    {isMarque ? (
                        <div className='space-y-4'>
                            <Field
                                label='AT Protocol account'
                                hint='DNS records are written to the connected account’s repository. Connect the account that owns this domain.'
                                error={errors['dns_config.session_id']}
                            >
                                <Dropdown
                                    value={config.session_id ?? ''}
                                    onChange={(value) => setConfig({ ...config, session_id: value })}
                                    placeholder='No account connected'
                                    options={atprotoSessions.map((session) => ({
                                        value: session.id,
                                        label: session.handle ?? session.did,
                                        description: session.did,
                                    }))}
                                />
                            </Field>
                            <div className='grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center'>
                                <Field
                                    label='Connect a new account'
                                    hint='Enter a handle (e.g. you.bsky.social) or DID.'
                                >
                                    <Input.Text
                                        autoComplete='off'
                                        placeholder='you.bsky.social'
                                        value={atprotoIdentifier}
                                        onChange={(e) => setAtprotoIdentifier(e.target.value)}
                                    />
                                </Field>
                                <Button type='button' variant='secondary' onClick={connectAtproto}>
                                    Connect with AT Protocol
                                </Button>
                            </div>

                            <div className='space-y-4 border-t border-mocha-400 pt-4'>
                                <p className='text-xs text-cream-400/60'>
                                    Or authenticate with an app password. This is only used when no account is connected
                                    above.
                                </p>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <Field label='Handle or DID' error={errors['dns_config.identifier']}>
                                        <Input.Text
                                            autoComplete='off'
                                            placeholder='you.bsky.social'
                                            value={config.identifier ?? ''}
                                            onChange={(e) => setConfig({ ...config, identifier: e.target.value })}
                                        />
                                    </Field>
                                    <Field label='App password' error={errors['dns_config.app_password']}>
                                        <Input.Text
                                            type='password'
                                            autoComplete='off'
                                            value={config.app_password ?? ''}
                                            onChange={(e) => setConfig({ ...config, app_password: e.target.value })}
                                        />
                                    </Field>
                                    <Field
                                        label='PDS URL'
                                        hint='Optional. Leave empty to discover it automatically.'
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
                                <p className='text-xs text-cream-400/60'>This provider has no configuration options.</p>
                            )}
                        </div>
                    )}

                    <div>
                        <Button type='button' variant='secondary' onClick={test} disabled={testing}>
                            Test Connection
                        </Button>
                    </div>
                </div>

                <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <Field label='Status' error={errors.is_active}>
                            <Dropdown
                                value={isActive ? 'true' : 'false'}
                                onChange={(value) => setIsActive(value === 'true')}
                                options={[
                                    { value: 'true', label: 'Active' },
                                    { value: 'false', label: 'Inactive' },
                                ]}
                            />
                        </Field>
                        <Field
                            label='Default Domain'
                            error={errors.is_default}
                            hint='The default domain used for new server subdomains.'
                        >
                            <Dropdown
                                value={isDefault ? 'true' : 'false'}
                                onChange={(value) => setIsDefault(value === 'true')}
                                options={[
                                    { value: 'false', label: 'No' },
                                    { value: 'true', label: 'Yes' },
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
                        Cancel
                    </Button>
                    <Button type='submit' disabled={submitting}>
                        {domain ? 'Update Domain' : 'Create Domain'}
                    </Button>
                </div>
            </form>

            {domain && (
                <div className='rounded-xl border border-brand-400/40 bg-brand-400/5 p-4'>
                    <h2 className='text-sm font-semibold text-brand-400'>Delete Domain</h2>
                    <p className='mt-1 text-sm text-cream-400/70'>Domains with active subdomains cannot be deleted.</p>
                    <Button
                        variant='attention'
                        className='mt-3'
                        disabled={domain.active_subdomains_count > 0}
                        onClick={() => setConfirmDelete(true)}
                    >
                        Delete Domain
                    </Button>
                </div>
            )}

            <Dialog.Confirm
                open={confirmDelete}
                title='Delete Domain'
                confirm='Delete'
                onClose={() => setConfirmDelete(false)}
                onConfirmed={remove}
                loading={deleting}
            >
                Deleting this domain is permanent and cannot be undone.
            </Dialog.Confirm>
        </div>
    );
};

const DomainFormContainer = () => {
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
                That domain could not be found.
            </div>
        );
    }

    return <DomainForm key={domain?.id ?? 'new'} providers={data.providers} domain={domain} onSaved={mutate} />;
};

export default DomainFormContainer;
