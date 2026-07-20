import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';

import Spinner from '@/components/elements/Spinner';
import { getDomains, type DomainData, type DomainsResponse, createDomain, updateDomain, deleteDomain, testDnsConnection, getProviderSchema } from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';
import { Button } from '@/components/ui/button';

const DomainsList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DomainsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchDomains = () => {
        setLoading(true);
        getDomains()
            .then(setData)
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDomains(); }, []);

    const handleDelete = (domain: DomainData) => {
        if (!confirm(`Delete domain "${domain.name}"? This cannot be undone.`)) return;
        deleteDomain(domain.id)
            .then(fetchDomains)
            .catch((e) => setError(httpErrorToHuman(e)));
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className='mt-6 bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400 text-sm'>
                {error}
            </div>
        );
    }

    const domains = data?.domains || [];

    return (
        <div className='mt-6'>
            <div className='bg-mocha-500 rounded-lg border border-mocha-400 overflow-hidden'>
                <div className='px-5 py-4 border-b border-mocha-400 flex items-center justify-between'>
                    <h3 className='text-sm font-semibold text-mocha-100 uppercase tracking-wider'>Configured Domains</h3>
                    <Button variant='secondary'>
                        <Link
                            to='/admin/settings/domains/create'
                        >
                            Create New Domain
                        </Link>
                    </Button>
                </div>

                {domains.length === 0 ? (
                    <div className='text-center py-12'>
                        <h4 className='text-mocha-200 text-sm font-medium'>No domains configured</h4>
                        <p className='text-mocha-200/60 text-xs mt-1'>Configure DNS domains to enable subdomain management for servers.</p>
                        <Link to='/admin/settings/domains/create'>
                            <Button variant='default'>
                                Create Your First Domain
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='border-b border-mocha-400'>
                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Domain Name</th>
                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>DNS Provider</th>
                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Status</th>
                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Default</th>
                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Subdomains</th>
                                    <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Created</th>
                                    <th className='text-right px-4 py-3 text-mocha-200 font-medium'></th>
                                </tr>
                            </thead>
                            <tbody>
                                {domains.map((domain) => (
                                    <tr key={domain.id} className='border-b border-mocha-400 hover:bg-mocha-600/50'>
                                        <td className='px-4 py-3'>
                                            <code className='text-cream-400 text-xs'>{domain.name}</code>
                                        </td>
                                        <td className='px-4 py-3'>
                                            <span className='inline-block px-2 py-0.5 bg-mocha-400/20 text-cream-400 text-xs rounded'>
                                                {domain.dns_provider.charAt(0).toUpperCase() + domain.dns_provider.slice(1)}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3'>
                                            {domain.is_active ? (
                                                <span className='inline-block px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded'>Active</span>
                                            ) : (
                                                <span className='inline-block px-2 py-0.5 bg-red-900/30 text-red-400 text-xs rounded'>Inactive</span>
                                            )}
                                        </td>
                                        <td className='px-4 py-3'>
                                            {domain.is_default && (
                                                <span className='inline-block px-2 py-0.5 bg-mocha-400/20 text-cream-400 text-xs rounded'>Default</span>
                                            )}
                                        </td>
                                        <td className='px-4 py-3'>
                                            <span className='inline-block px-2 py-0.5 bg-mocha-400 text-mocha-200 text-xs rounded'>
                                                {domain.server_subdomains_count || 0}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3 text-mocha-200 text-xs'>
                                            {new Date(domain.created_at).toLocaleDateString()}
                                        </td>
                                        <td className='px-4 py-3 text-right'>
                                            <div className='flex items-center justify-end gap-2'>
                                                <Button
                                                    variant='secondary'

                                                    onClick={() => navigate(`/admin/settings/domains/${domain.id}/edit`)}
                                                >
                                                    Edit
                                                </Button>
                                                {(domain.server_subdomains_count || 0) === 0 && (
                                                    <Button
                                                        variant='attention'
                                                        onClick={() => handleDelete(domain)}
                                                    >
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
        </div>
    );
};

const DomainForm = ({ domain }: { domain?: DomainData }) => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [form, setForm] = useState({
        name: domain?.name || '',
        dns_provider: domain?.dns_provider || '',
        is_active: domain?.is_active ?? true,
        is_default: domain?.is_default ?? false,
    });
    const [dnsConfig, setDnsConfig] = useState<Record<string, string>>(domain?.dns_config || {});
    const [configSchema, setConfigSchema] = useState<Record<string, { description: string; required: boolean; sensitive: boolean }> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
            })
            .catch((e) => {
                const msg = httpErrorToHuman(e);
                setTestResult({ type: 'error', message: msg });
            })
            .finally(() => setTesting(false));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        const payload = { ...form, dns_config: dnsConfig };
        const promise = domain
            ? updateDomain(domain.id, payload)
            : createDomain(payload);

        promise
            .then(() => navigate('/admin/settings/domains'))
            .catch((err) => {
                const resp = err?.response?.data;
                setError(resp?.error || httpErrorToHuman(err));
            })
            .finally(() => setSaving(false));
    };

    const providers: Record<string, string> = {
        cloudflare: 'Cloudflare',
        hetzner: 'Hetzner',
        route53: 'AWS Route53',
    };

    return (
        <div className='mt-6'>
            <form onSubmit={handleSubmit}>
                <div className='bg-mocha-500 rounded-lg border border-mocha-400 overflow-hidden mb-6'>
                    <div className='px-5 py-4 border-b border-mocha-400'>
                        <h3 className='text-sm font-semibold text-mocha-100 uppercase tracking-wider'>Domain Information</h3>
                    </div>
                    <div className='p-5'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <label className='block text-sm font-medium text-mocha-200 mb-1'>Domain Name</label>
                                <input
                                    type='text'
                                    className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300'
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder='example.com'
                                    required
                                />
                                <p className='text-xs text-mocha-200/60 mt-1'>The domain name used for subdomains (e.g., example.com).</p>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-mocha-200 mb-1'>DNS Provider</label>
                                <select
                                    className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300'
                                    value={form.dns_provider}
                                    onChange={(e) => setForm({ ...form, dns_provider: e.target.value })}
                                    required
                                >
                                    <option value=''>Select a DNS provider...</option>
                                    {Object.entries(providers).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                                <p className='text-xs text-mocha-200/60 mt-1'>The DNS service provider that manages this domain.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {configSchema && (
                    <div className='bg-mocha-500 rounded-lg border border-mocha-400 overflow-hidden mb-6'>
                        <div className='px-5 py-4 border-b border-mocha-400'>
                            <h3 className='text-sm font-semibold text-mocha-100 uppercase tracking-wider'>DNS Provider Configuration</h3>
                        </div>
                        <div className='p-5'>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                {Object.entries(configSchema).map(([key, field]) => (
                                    <div key={key}>
                                        <label className='block text-sm font-medium text-mocha-200 mb-1'>
                                            {field.description || key}
                                            {field.required && <span className='text-red-400 ml-1'>*</span>}
                                        </label>
                                        <input
                                            type={field.sensitive ? 'password' : 'text'}
                                            className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300'
                                            value={dnsConfig[key] || ''}
                                            onChange={(e) => handleDnsConfigChange(key, e.target.value)}
                                            required={field.required}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className='bg-mocha-500 rounded-lg border border-mocha-400 overflow-hidden mb-6'>
                    <div className='px-5 py-4 border-b border-mocha-400'>
                        <h3 className='text-sm font-semibold text-mocha-100 uppercase tracking-wider'>Additional Settings</h3>
                    </div>
                    <div className='p-5'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <label className='block text-sm font-medium text-mocha-200 mb-2'>Status</label>
                                <div className='flex gap-2'>
                                    {[{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }].map((opt) => (
                                        <label key={String(opt.value)} className='flex-1 cursor-pointer'>
                                            <input
                                                type='radio'
                                                name='is_active'
                                                checked={form.is_active === opt.value}
                                                onChange={() => setForm({ ...form, is_active: opt.value })}
                                                className='hidden peer'
                                            />
                                            <div className='px-4 py-2 bg-mocha-600 border border-mocha-400 rounded-lg text-center text-sm peer-checked:border-mocha-300 peer-checked:bg-mocha-500/20 transition-colors'>
                                                <span className={`font-medium ${form.is_active === opt.value ? 'text-cream-400' : 'text-mocha-100'}`}>
                                                    {opt.label}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <p className='text-xs text-mocha-200/60 mt-2'>Whether this domain should be available for subdomain creation.</p>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-mocha-200 mb-2'>Default Domain</label>
                                <div className='flex gap-2'>
                                    {[{ value: true, label: 'Yes' }, { value: false, label: 'No' }].map((opt) => (
                                        <label key={String(opt.value)} className='flex-1 cursor-pointer'>
                                            <input
                                                type='radio'
                                                name='is_default'
                                                checked={form.is_default === opt.value}
                                                onChange={() => setForm({ ...form, is_default: opt.value })}
                                                className='hidden peer'
                                            />
                                            <div className='px-4 py-2 bg-mocha-600 border border-mocha-400 rounded-lg text-center text-sm peer-checked:border-mocha-300 peer-checked:bg-mocha-500/20 transition-colors'>
                                                <span className={`font-medium ${form.is_default === opt.value ? 'text-cream-400' : 'text-mocha-100'}`}>
                                                    {opt.label}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <p className='text-xs text-mocha-200/60 mt-2'>Use as default for automatic subdomain generation.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className='mb-4 bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-400 text-sm'>
                        {error}
                    </div>
                )}

                {testResult && (
                    <div className={`mb-4 rounded-lg p-3 text-sm ${testResult.type === 'success' ? 'bg-green-900/20 border border-green-800 text-green-400' : 'bg-red-900/20 border border-red-800 text-red-400'}`}>
                        {testResult.message}
                    </div>
                )}

                <div className='flex items-center justify-between gap-3'>
                    <div className='flex gap-2'>
                        {form.dns_provider && (
                            <Button type='button' variant='secondary' onClick={handleTestConnection} disabled={testing}>
                                {testing ? (
                                    <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
                                    </svg>
                                ) : (
                                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' />
                                    </svg>
                                )}
                                Test Connection
                            </Button>
                        )}
                    </div>
                    <div className='flex items-center gap-2'>
                        <Link to='/admin/settings/domains'>
                            <Button variant='secondary'>Cancel</Button>
                        </Link>
                        <Button type='submit' variant='default' disabled={saving}>
                            {saving && (
                                <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
                                </svg>
                            )}
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4' />
                            </svg>
                            {domain ? 'Update Domain' : 'Create Domain'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
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

const DomainFormWrapper = () => {
    const [loading, setLoading] = useState(true);
    const [domain, setDomain] = useState<DomainData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getDomains().then((data) => {
            const id = parseInt(window.location.pathname.split('/').slice(-2, -1)[0]);
            const found = data.domains.find((d) => d.id === id);
            if (found) {
                setDomain(found);
            } else {
                setError('Domain not found.');
            }
        }).catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner />
            </div>
        );
    }

    if (error || !domain) {
        return (
            <div className='mt-6 bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400 text-sm'>
                {error || 'Domain not found.'}
            </div>
        );
    }

    return <DomainForm domain={domain} />;
};

export default DomainsSettingsTab;
