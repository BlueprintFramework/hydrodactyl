import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';

import Spinner from '@/components/elements/Spinner';
import { getDomains, type DomainData, type DomainsResponse, createDomain, updateDomain, deleteDomain, testDnsConnection, getProviderSchema } from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';

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
            <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden'>
                <div className='px-5 py-4 border-b border-gray-800 flex items-center justify-between'>
                    <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wider'>Configured Domains</h3>
                    <Link
                        to='/admin/settings/domains/create'
                        className='px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-medium transition-colors'
                    >
                        Create New Domain
                    </Link>
                </div>

                {domains.length === 0 ? (
                    <div className='text-center py-12'>
                        <h4 className='text-gray-500 text-sm font-medium'>No domains configured</h4>
                        <p className='text-gray-600 text-xs mt-1'>Configure DNS domains to enable subdomain management for servers.</p>
                        <Link
                            to='/admin/settings/domains/create'
                            className='inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-medium transition-colors'
                        >
                            Create Your First Domain
                        </Link>
                    </div>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='border-b border-gray-800'>
                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>Domain Name</th>
                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>DNS Provider</th>
                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>Status</th>
                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>Default</th>
                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>Subdomains</th>
                                    <th className='text-left px-4 py-3 text-gray-500 font-medium'>Created</th>
                                    <th className='text-right px-4 py-3 text-gray-500 font-medium'></th>
                                </tr>
                            </thead>
                            <tbody>
                                {domains.map((domain) => (
                                    <tr key={domain.id} className='border-b border-gray-800 hover:bg-gray-900/50'>
                                        <td className='px-4 py-3'>
                                            <code className='text-gray-200 text-xs'>{domain.name}</code>
                                        </td>
                                        <td className='px-4 py-3'>
                                            <span className='inline-block px-2 py-0.5 bg-blue-900/30 text-blue-400 text-xs rounded'>
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
                                                <span className='inline-block px-2 py-0.5 bg-blue-900/30 text-blue-400 text-xs rounded'>Default</span>
                                            )}
                                        </td>
                                        <td className='px-4 py-3'>
                                            <span className='inline-block px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded'>
                                                {domain.server_subdomains_count || 0}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3 text-gray-500 text-xs'>
                                            {new Date(domain.created_at).toLocaleDateString()}
                                        </td>
                                        <td className='px-4 py-3 text-right'>
                                            <div className='flex items-center justify-end gap-2'>
                                                <button
                                                    onClick={() => navigate(`/admin/settings/domains/${domain.id}/edit`)}
                                                    className='px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors'
                                                >
                                                    Edit
                                                </button>
                                                {(domain.server_subdomains_count || 0) === 0 && (
                                                    <button
                                                        onClick={() => handleDelete(domain)}
                                                        className='px-2 py-1 bg-red-800 hover:bg-red-700 text-red-200 text-xs rounded transition-colors'
                                                    >
                                                        Delete
                                                    </button>
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
                <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden mb-6'>
                    <div className='px-5 py-4 border-b border-gray-800'>
                        <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wider'>Domain Information</h3>
                    </div>
                    <div className='p-5'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-400 mb-1'>Domain Name</label>
                                <input
                                    type='text'
                                    className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder='example.com'
                                    required
                                />
                                <p className='text-xs text-gray-600 mt-1'>The domain name used for subdomains (e.g., example.com).</p>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-400 mb-1'>DNS Provider</label>
                                <select
                                    className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                    value={form.dns_provider}
                                    onChange={(e) => setForm({ ...form, dns_provider: e.target.value })}
                                    required
                                >
                                    <option value=''>Select a DNS provider...</option>
                                    {Object.entries(providers).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                                <p className='text-xs text-gray-600 mt-1'>The DNS service provider that manages this domain.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {configSchema && (
                    <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden mb-6'>
                        <div className='px-5 py-4 border-b border-gray-800'>
                            <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wider'>DNS Provider Configuration</h3>
                        </div>
                        <div className='p-5'>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                {Object.entries(configSchema).map(([key, field]) => (
                                    <div key={key}>
                                        <label className='block text-sm font-medium text-gray-400 mb-1'>
                                            {field.description || key}
                                            {field.required && <span className='text-red-400 ml-1'>*</span>}
                                        </label>
                                        <input
                                            type={field.sensitive ? 'password' : 'text'}
                                            className='w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
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

                <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden mb-6'>
                    <div className='px-5 py-4 border-b border-gray-800'>
                        <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wider'>Additional Settings</h3>
                    </div>
                    <div className='p-5'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <label className='block text-sm font-medium text-gray-400 mb-2'>Status</label>
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
                                            <div className='px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-center text-sm peer-checked:border-blue-500 peer-checked:bg-blue-900/20 transition-colors'>
                                                <span className={`font-medium ${form.is_active === opt.value ? 'text-blue-400' : 'text-gray-300'}`}>
                                                    {opt.label}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <p className='text-xs text-gray-600 mt-2'>Whether this domain should be available for subdomain creation.</p>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-400 mb-2'>Default Domain</label>
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
                                            <div className='px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-center text-sm peer-checked:border-blue-500 peer-checked:bg-blue-900/20 transition-colors'>
                                                <span className={`font-medium ${form.is_default === opt.value ? 'text-blue-400' : 'text-gray-300'}`}>
                                                    {opt.label}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <p className='text-xs text-gray-600 mt-2'>Use as default for automatic subdomain generation.</p>
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
                            <button
                                type='button'
                                onClick={handleTestConnection}
                                disabled={testing}
                                className='px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 text-sm rounded font-medium transition-colors flex items-center gap-1.5'
                            >
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
                            </button>
                        )}
                    </div>
                    <div className='flex items-center gap-2'>
                        <Link
                            to='/admin/settings/domains'
                            className='px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded font-medium transition-colors'
                        >
                            Cancel
                        </Link>
                        <button
                            type='submit'
                            disabled={saving}
                            className='px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded font-medium transition-colors flex items-center gap-1.5'
                        >
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
                        </button>
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
