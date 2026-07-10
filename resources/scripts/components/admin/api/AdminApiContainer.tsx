import { useState } from 'react';
import useSWR from 'swr';
import { type AdminApiKey, type CreateApiKeyData, createApiKey, deleteApiKey, getApiKeys } from '@/api/admin/apiKeys';
import { httpErrorToHuman } from '@/api/http';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';

const AdminApiContainer = () => {
    const [page, setPage] = useState(1);
    const [showCreate, setShowCreate] = useState(false);
    const [memo, setMemo] = useState('');
    const [allowedIps, setAllowedIps] = useState('');
    const [creating, setCreating] = useState(false);
    const [createdToken, setCreatedToken] = useState<string | null>(null);
    const { data, error, mutate } = useSWR(['admin:api-keys', page], () => getApiKeys({ page }));

    const handleCreate = async () => {
        if (!memo.trim()) return;
        setCreating(true);
        try {
            const payload: CreateApiKeyData = {
                memo: memo.trim(),
                allowedIps: allowedIps
                    ? allowedIps
                          .split(',')
                          .map((ip) => ip.trim())
                          .filter(Boolean)
                    : null,
            };
            const result = await createApiKey(payload);
            setCreatedToken(result.token);
            setMemo('');
            setAllowedIps('');
            setShowCreate(false);
            mutate();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) return;
        try {
            await deleteApiKey(id);
            mutate();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    const handleCopyToken = () => {
        if (createdToken) {
            navigator.clipboard.writeText(createdToken);
        }
    };

    return (
        <div>
            <MainPageHeader title='API Keys'>
                <button
                    onClick={() => {
                        setShowCreate(!showCreate);
                        setCreatedToken(null);
                    }}
                    className='px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors'
                >
                    Create API Key
                </button>
            </MainPageHeader>

            {error && <div className='text-red-400 mb-4'>Error: {httpErrorToHuman(error)}</div>}

            {createdToken && (
                <div className='bg-[#1a1a1a] border border-yellow-800 rounded-lg p-4 mb-4'>
                    <div className='flex items-start justify-between'>
                        <div>
                            <p className='text-yellow-400 font-medium text-sm mb-1'>
                                API Key Created — Copy This Token Now
                            </p>
                            <p className='text-gray-500 text-xs mb-3'>
                                This token will not be shown again. Store it securely.
                            </p>
                            <code className='block bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-200 break-all font-mono'>
                                {createdToken}
                            </code>
                        </div>
                        <button
                            onClick={handleCopyToken}
                            className='ml-4 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors whitespace-nowrap'
                        >
                            Copy
                        </button>
                    </div>
                </div>
            )}

            {showCreate && !createdToken && (
                <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-4'>
                    <h3 className='text-sm font-medium text-gray-200 mb-3'>New API Key</h3>
                    <div className='space-y-3'>
                        <div>
                            <label className='block text-xs text-gray-500 mb-1'>Memo</label>
                            <input
                                type='text'
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                placeholder='e.g. Production server key'
                                className='w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600'
                            />
                        </div>
                        <div>
                            <label className='block text-xs text-gray-500 mb-1'>Allowed IPs (comma-separated)</label>
                            <textarea
                                value={allowedIps}
                                onChange={(e) => setAllowedIps(e.target.value)}
                                placeholder='e.g. 192.168.1.1, 10.0.0.1'
                                rows={2}
                                className='w-full bg-gray-900 border border-gray-800 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600 resize-none'
                            />
                        </div>
                        <div className='flex gap-2'>
                            <button
                                onClick={handleCreate}
                                disabled={!memo.trim() || creating}
                                className='px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors'
                            >
                                {creating ? 'Creating...' : 'Create Key'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreate(false);
                                    setMemo('');
                                    setAllowedIps('');
                                }}
                                className='px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors'
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!data ? (
                <Spinner />
            ) : (
                <Pagination data={data} onPageSelect={setPage}>
                    {({ items }) => (
                        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden'>
                            <table className='w-full text-sm'>
                                <thead>
                                    <tr className='border-b border-gray-800'>
                                        <th className='text-left px-4 py-3 text-gray-500 font-medium'>Identifier</th>
                                        <th className='text-left px-4 py-3 text-gray-500 font-medium'>Memo</th>
                                        <th className='text-left px-4 py-3 text-gray-500 font-medium'>Allowed IPs</th>
                                        <th className='text-left px-4 py-3 text-gray-500 font-medium'>Last Used</th>
                                        <th className='text-left px-4 py-3 text-gray-500 font-medium'>Created</th>
                                        <th className='text-right px-4 py-3 text-gray-500 font-medium'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className='text-center py-8 text-gray-500'>
                                                No API keys found.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((apiKey: AdminApiKey) => (
                                            <tr
                                                key={apiKey.id}
                                                className='border-b border-gray-800 last:border-0 hover:bg-white/[0.02]'
                                            >
                                                <td className='px-4 py-3 text-gray-200 font-mono text-xs'>
                                                    {apiKey.identifier}
                                                </td>
                                                <td className='px-4 py-3 text-gray-300'>{apiKey.memo || '—'}</td>
                                                <td className='px-4 py-3 text-gray-400 text-xs'>
                                                    {apiKey.allowedIps ? (
                                                        apiKey.allowedIps.join(', ')
                                                    ) : (
                                                        <span className='text-gray-600'>Any</span>
                                                    )}
                                                </td>
                                                <td className='px-4 py-3 text-gray-400 text-xs'>
                                                    {apiKey.lastUsedAt ? (
                                                        new Date(apiKey.lastUsedAt).toLocaleDateString()
                                                    ) : (
                                                        <span className='text-gray-600'>Never</span>
                                                    )}
                                                </td>
                                                <td className='px-4 py-3 text-gray-400 text-xs'>
                                                    {new Date(apiKey.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className='px-4 py-3 text-right'>
                                                    <button
                                                        onClick={() => handleDelete(apiKey.id)}
                                                        className='text-xs text-red-400 hover:text-red-300'
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Pagination>
            )}
        </div>
    );
};

export default AdminApiContainer;
