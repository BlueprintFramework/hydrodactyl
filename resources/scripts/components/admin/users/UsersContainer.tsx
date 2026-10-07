import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useUsers } from '@/api/admin/useUsers';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { Button } from '@/components/ui/button';

const UsersContainer = () => {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [search] = useDebounce(searchTerm, 300);

    const { data, isValidating } = useUsers({ page, search: search || undefined });

    const users = data?.items ?? [];

    return (
        <PageContentBlock title='Users'>
            <MainPageHeader direction='column' title='Users'>
                <p className='text-sm text-neutral-400'>All registered users on the system.</p>
            </MainPageHeader>

            <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center'>
                <Input.Text
                    placeholder='Search by username or email...'
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                    }}
                    className='w-full sm:max-w-sm'
                />
                <Button asChild className='sm:ml-auto'>
                    <Link to='/users/new'>Create User</Link>
                </Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-300'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-300'>
                            <th className='px-4 py-3'>ID</th>
                            <th className='px-4 py-3'>Email</th>
                            <th className='px-4 py-3'>Username</th>
                            <th className='px-4 py-3 text-center'>2FA</th>
                            <th className='px-4 py-3 text-center'>Servers Owned</th>
                            <th className='px-4 py-3 text-center'>Can Access</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className='border-b border-mocha-300/40 hover:bg-mocha-400/20'>
                                <td className='px-4 py-3 font-mono text-cream-400/60'>{user.id}</td>
                                <td className='px-4 py-3'>
                                    <Link to={`/users/${user.id}`} className='text-cream-50 hover:text-brand'>
                                        {user.email}
                                    </Link>
                                    {user.root_admin && (
                                        <span className='ml-2 rounded-full bg-hydro-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-hydro-400'>
                                            Admin
                                        </span>
                                    )}
                                </td>
                                <td className='px-4 py-3 text-cream-100'>{user.username}</td>
                                <td className='px-4 py-3 text-center text-cream-400/70'>
                                    {user.use_totp ? 'Enabled' : '—'}
                                </td>
                                <td className='px-4 py-3 text-center text-cream-100'>{user.servers_count}</td>
                                <td className='px-4 py-3 text-center text-cream-100'>{user.subuser_of_count}</td>
                            </tr>
                        ))}
                        {!isValidating && users.length === 0 && (
                            <tr>
                                <td colSpan={6} className='px-4 py-8 text-center text-cream-400/50'>
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {data && data.pagination.total > 0 && (
                <PaginationFooter pagination={data.pagination} onPageSelect={setPage} className='mt-4' />
            )}
        </PageContentBlock>
    );
};

export default UsersContainer;
