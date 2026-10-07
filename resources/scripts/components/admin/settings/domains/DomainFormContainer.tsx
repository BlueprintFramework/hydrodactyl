import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
    createDomain,
    type Domain,
    type DomainProvider,
    deleteDomain,
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

    const { data: schema } = useProviderSchema(provider);

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
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {Object.entries(schema ?? {}).map(([key, field]) => (
                            <Field
                                key={key}
                                label={labelFor(key)}
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
