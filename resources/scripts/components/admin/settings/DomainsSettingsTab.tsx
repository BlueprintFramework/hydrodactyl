import { Add01Icon, Delete02Icon, Edit02Icon, Globe02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useCallback, useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
    createDomain,
    type DomainData,
    type DomainsResponse,
    deleteDomain,
    getDomains,
    getProviderSchema,
    testDnsConnection,
    updateDomain,
} from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const DomainsList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DomainsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DomainData | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchDomains = useCallback(() => {
        setLoading(true);
        getDomains()
            .then(setData)
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchDomains();
    }, [fetchDomains]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        deleteDomain(deleteTarget.id)
            .then(() => {
                toast.success(`Domain "${deleteTarget.name}" deleted successfully`);
                setDeleteTarget(null);
                fetchDomains();
            })
            .catch((e) => toast.error(httpErrorToHuman(e)))
            .finally(() => setDeleting(false));
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner />
            </div>
        );
    }

    if (error) {
        return <div className='text-red-400 p-4'>Error: {error}</div>;
    }

    const domains = data?.domains || [];

    return (
        <div className='space-y-6 mt-4'>
            {/* Profile Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                    <div className='w-16 h-16 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 border border-mocha-400'>
                        <HugeiconsIcon icon={Globe02Icon} className='w-8 h-8 text-brand' />
                    </div>
                    <div className='flex-1'>
                        <h2 className='text-xl font-bold text-cream-400'>Domain Management</h2>
                        <p className='text-mocha-200 text-sm mt-1'>Configure DNS domains for subdomain management</p>
                    </div>
                    <div className='flex items-center gap-3'>
                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                            <p className='text-2xl font-bold text-cream-400'>{domains.length}</p>
                            <p className='text-xs text-mocha-200'>Domains</p>
                        </div>
                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                            <p className='text-2xl font-bold text-green-400'>
                                {domains.filter((d) => d.is_active).length}
                            </p>
                            <p className='text-xs text-mocha-200'>Active</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Domains Table Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex items-center justify-between mb-6'>
                    <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                            <HugeiconsIcon icon={Globe02Icon} className='w-5 h-5 text-cream-400' />
                        </div>
                        <div>
                            <h3 className='text-cream-400 font-semibold text-lg'>Configured Domains</h3>
                            <p className='text-mocha-200 text-sm'>All registered DNS domains</p>
                        </div>
                    </div>
                    <Link to='/admin/settings/domains/create'>
                        <Button variant='default'>
                            <HugeiconsIcon icon={Add01Icon} className='w-4 h-4' />
                            Create Domain
                        </Button>
                    </Link>
                </div>

                {domains.length === 0 ? (
                    <div className='text-center py-12'>
                        <HugeiconsIcon icon={Globe02Icon} className='w-12 h-12 mx-auto mb-3 text-mocha-400' />
                        <p className='text-mocha-200 text-sm font-medium'>No domains configured</p>
                        <p className='text-mocha-200/60 text-xs mt-1'>
                            Configure DNS domains to enable subdomain management for servers.
                        </p>
                        <Link to='/admin/settings/domains/create' className='mt-4 inline-block'>
                            <Button variant='default'>Create Your First Domain</Button>
                        </Link>
                    </div>
                ) : (
                    <div className='bg-mocha-500 border border-mocha-400 rounded-lg overflow-hidden'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='border-b border-mocha-400'>
                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Domain</th>
                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium hidden md:table-cell'>
                                        Provider
                                    </th>
                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium hidden lg:table-cell'>
                                        Status
                                    </th>
                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium hidden lg:table-cell'>
                                        Default
                                    </th>
                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Subdomains</th>
                                    <th className='text-right px-4 py-3 text-mocha-200 font-medium'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {domains.map((domain) => (
                                    <tr
                                        key={domain.id}
                                        className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'
                                    >
                                        <td className='px-4 py-3'>
                                            <code className='text-xs text-cream-400 bg-mocha-600/50 px-1.5 py-0.5 rounded'>
                                                {domain.name}
                                            </code>
                                        </td>
                                        <td className='px-4 py-3 hidden md:table-cell'>
                                            <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-mocha-400/50 text-mocha-200'>
                                                {domain.dns_provider.charAt(0).toUpperCase() +
                                                    domain.dns_provider.slice(1)}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3 hidden lg:table-cell'>
                                            {domain.is_active ? (
                                                <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-900/50 text-green-400'>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-900/50 text-red-400'>
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className='px-4 py-3 hidden lg:table-cell'>
                                            {domain.is_default && (
                                                <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-mocha-400/50 text-mocha-200'>
                                                    Default
                                                </span>
                                            )}
                                        </td>
                                        <td className='px-4 py-3'>
                                            <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-mocha-400 text-mocha-200'>
                                                {domain.server_subdomains_count || 0}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3 text-right'>
                                            <div className='flex items-center justify-end gap-2'>
                                                <Button
                                                    variant='secondary'
                                                    size='sm'
                                                    onClick={() =>
                                                        navigate(`/admin/settings/domains/${domain.id}/edit`)
                                                    }
                                                >
                                                    <HugeiconsIcon icon={Edit02Icon} className='w-3.5 h-3.5' />
                                                    Edit
                                                </Button>
                                                {(domain.server_subdomains_count || 0) === 0 && (
                                                    <Button
                                                        variant='attention'
                                                        size='sm'
                                                        onClick={() => setDeleteTarget(domain)}
                                                    >
                                                        <HugeiconsIcon icon={Delete02Icon} className='w-3.5 h-3.5' />
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog.Confirm
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirmed={handleDelete}
                title='Delete Domain'
                confirm='Delete'
                loading={deleting}
            >
                Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong>? This action cannot be
                undone.
            </Dialog.Confirm>
        </div>
    );
};

const DomainForm = ({
    domain,
    providers: propProviders,
}: {
    domain?: DomainData;
    providers?: Record<string, { name: string; description: string }>;
}) => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [fetchedProviders, setFetchedProviders] = useState<Record<string, { name: string; description: string }>>({});
    const [form, setForm] = useState({
        name: domain?.name || '',
        dns_provider: domain?.dns_provider || '',
        is_active: domain?.is_active ?? true,
        is_default: domain?.is_default ?? false,
    });
    const [dnsConfig, setDnsConfig] = useState<Record<string, string>>(domain?.dns_config || {});
    const [configSchema, setConfigSchema] = useState<Record<
        string,
        { description: string; required: boolean; sensitive: boolean }
    > | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (!propProviders) {
            getDomains()
                .then((data) => setFetchedProviders(data.providers))
                .catch(() => {
                    // intentionally empty
                });
        }
    }, [propProviders]);

    useEffect(() => {
        if (form.dns_provider) {
            getProviderSchema(form.dns_provider)
                .then((resp) => {
                    if (resp.success) setConfigSchema(resp.schema);
                })
                .catch(() => setConfigSchema(null));
        } else {
            setConfigSchema(null);
        }
    }, [form.dns_provider]);

    const handleDnsConfigChange = (key: string, value: string) => {
        setDnsConfig({ ...dnsConfig, [key]: value });
    };

    const handleTestConnection = () => {
        setTestResult(null);
        setTesting(true);
        testDnsConnection({ dns_provider: form.dns_provider, dns_config: dnsConfig })
            .then((resp) => {
                setTestResult({ type: resp.success ? 'success' : 'error', message: resp.message });
                toast[resp.success ? 'success' : 'error'](resp.message);
            })
            .catch((e) => {
                const msg = httpErrorToHuman(e);
                setTestResult({ type: 'error', message: msg });
                toast.error(msg);
            })
            .finally(() => setTesting(false));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        const payload = { ...form, dns_config: dnsConfig };
        const promise = domain ? updateDomain(domain.id, payload) : createDomain(payload);

        promise
            .then(() => {
                toast.success(domain ? 'Domain updated successfully' : 'Domain created successfully');
                navigate('/admin/settings/domains');
            })
            .catch((err) => {
                const resp = err?.response?.data;
                const msg = resp?.error || httpErrorToHuman(err);
                setError(msg);
                toast.error(msg);
            })
            .finally(() => setSaving(false));
    };

    const activeProviders = propProviders || fetchedProviders;
    const providerList = Object.fromEntries(Object.entries(activeProviders).map(([key, v]) => [key, v.name]));

    return (
        <div className='space-y-6 mt-4'>
            {/* Back Link */}
            <div>
                <Link
                    to='/admin/settings/domains'
                    className='text-sm text-mocha-200 hover:text-cream-400 transition-colors'
                >
                    &larr; Back to Domains
                </Link>
            </div>

            {/* Domain Info Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex items-center gap-3 mb-6'>
                    <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                        <HugeiconsIcon icon={Globe02Icon} className='w-5 h-5 text-cream-400' />
                    </div>
                    <div>
                        <h3 className='text-cream-400 font-semibold text-lg'>
                            {domain ? 'Edit Domain' : 'Create Domain'}
                        </h3>
                        <p className='text-mocha-200 text-sm'>
                            {domain ? 'Update domain configuration' : 'Add a new DNS domain for subdomain management'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className='space-y-5'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                        <div>
                            <label className={labelClass} htmlFor='domain-name'>
                                Domain Name
                            </label>
                            <input
                                type='text'
                                className={inputClass}
                                id='domain-name'
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder='example.com'
                                required
                            />
                            <p className='text-xs text-mocha-200/60 mt-1'>The domain name used for subdomains.</p>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor='dns-provider'>
                                DNS Provider
                            </label>
                            <select
                                className={inputClass}
                                id='dns-provider'
                                value={form.dns_provider}
                                onChange={(e) => setForm({ ...form, dns_provider: e.target.value })}
                                required
                            >
                                <option value=''>Select a DNS provider...</option>
                                {Object.entries(providerList).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            <p className='text-xs text-mocha-200/60 mt-1'>The DNS service provider for this domain.</p>
                        </div>
                    </div>

                    {/* DNS Config */}
                    {configSchema && (
                        <div className='bg-mocha-600/50 rounded-xl p-5 space-y-4'>
                            <h4 className='text-cream-400 font-semibold'>DNS Provider Configuration</h4>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                {Object.entries(configSchema).map(([key, field]) => (
                                    <div key={key}>
                                        <label
                                            className={labelClass}
                                            htmlFor={`dns-config-${key.replace(/[^a-zA-Z0-9]/g, '-')}`}
                                        >
                                            {field.description || key}
                                            {field.required && <span className='text-red-400 ml-1'>*</span>}
                                        </label>
                                        <input
                                            type={field.sensitive ? 'password' : 'text'}
                                            className={inputClass}
                                            id={`dns-config-${key.replace(/[^a-zA-Z0-9]/g, '-')}`}
                                            value={dnsConfig[key] || ''}
                                            onChange={(e) => handleDnsConfigChange(key, e.target.value)}
                                            required={field.required}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Additional Settings */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                        <div>
                            <label className={labelClass} htmlFor='domain-status'>
                                Status
                            </label>
                            <div className='flex gap-2'>
                                {[
                                    { value: true, label: 'Active' },
                                    { value: false, label: 'Inactive' },
                                ].map((opt) => (
                                    <label key={String(opt.value)} className='flex-1 cursor-pointer'>
                                        <input
                                            type='radio'
                                            name='is_active'
                                            checked={form.is_active === opt.value}
                                            onChange={() => setForm({ ...form, is_active: opt.value })}
                                            className='hidden peer'
                                            id={opt.value ? 'domain-status' : undefined}
                                        />
                                        <div className='px-4 py-2 bg-mocha-600 border border-mocha-400 rounded-lg text-center text-sm peer-checked:border-mocha-300 peer-checked:bg-mocha-500/20 transition-colors'>
                                            <span
                                                className={`font-medium ${form.is_active === opt.value ? 'text-cream-400' : 'text-mocha-100'}`}
                                            >
                                                {opt.label}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={labelClass} htmlFor='default-domain'>
                                Default Domain
                            </label>
                            <div className='flex gap-2'>
                                {[
                                    { value: true, label: 'Yes' },
                                    { value: false, label: 'No' },
                                ].map((opt) => (
                                    <label key={String(opt.value)} className='flex-1 cursor-pointer'>
                                        <input
                                            type='radio'
                                            name='is_default'
                                            checked={form.is_default === opt.value}
                                            onChange={() => setForm({ ...form, is_default: opt.value })}
                                            className='hidden peer'
                                            id={opt.value ? 'default-domain' : undefined}
                                        />
                                        <div className='px-4 py-2 bg-mocha-600 border border-mocha-400 rounded-lg text-center text-sm peer-checked:border-mocha-300 peer-checked:bg-mocha-500/20 transition-colors'>
                                            <span
                                                className={`font-medium ${form.is_default === opt.value ? 'text-cream-400' : 'text-mocha-100'}`}
                                            >
                                                {opt.label}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {error && <div className='text-red-400 text-sm'>{error}</div>}

                    {testResult && (
                        <div
                            className={`rounded-lg p-3 text-sm ${testResult.type === 'success' ? 'bg-green-900/20 border border-green-800 text-green-400' : 'bg-red-900/20 border border-red-800 text-red-400'}`}
                        >
                            {testResult.message}
                        </div>
                    )}

                    <div className='flex items-center justify-between gap-3 pt-2'>
                        <div>
                            {form.dns_provider && (
                                <Button
                                    type='button'
                                    variant='secondary'
                                    onClick={handleTestConnection}
                                    disabled={testing}
                                >
                                    {testing ? 'Testing...' : 'Test Connection'}
                                </Button>
                            )}
                        </div>
                        <div className='flex items-center gap-3'>
                            <Link to='/admin/settings/domains'>
                                <Button variant='secondary'>Cancel</Button>
                            </Link>
                            <Button type='submit' variant='default' disabled={saving}>
                                {saving ? 'Saving...' : domain ? 'Update Domain' : 'Create Domain'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DomainFormWrapper = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [domain, setDomain] = useState<DomainData | null>(null);
    const [providers, setProviders] = useState<Record<string, { name: string; description: string }>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError('No domain ID provided.');
            setLoading(false);
            return;
        }
        getDomains()
            .then((data) => {
                setProviders(data.providers);
                const found = data.domains.find((d) => d.id === Number(id));
                if (found) {
                    setDomain(found);
                } else {
                    setError('Domain not found.');
                }
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner />
            </div>
        );
    }

    if (error || !domain) {
        return <div className='text-red-400 p-4'>Error: {error || 'Domain not found.'}</div>;
    }

    return <DomainForm domain={domain} providers={providers} />;
};

const DomainsSettingsTab = () => {
    return (
        <Routes>
            <Route path='' element={<DomainsList />} />
            <Route path='create' element={<DomainForm />} />
            <Route path=':id/edit' element={<DomainFormWrapper />} />
        </Routes>
    );
};

export default DomainsSettingsTab;
