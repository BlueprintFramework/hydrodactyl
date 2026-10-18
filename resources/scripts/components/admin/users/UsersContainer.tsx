import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useUsers } from '@/api/admin/useUsers';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

const UsersContainer = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [search] = useDebounce(searchTerm, 300);

    const { data, isValidating } = useUsers({ page, search: search || undefined });

    const users = data?.items ?? [];

    return (
        <PageContentBlock title={t('admin.nav.users')}>
            <MainPageHeader direction='column' title={t('admin.nav.users')}>
                <p className='text-sm text-neutral-400'>{t('admin.users.description')}</p>
            </MainPageHeader>

            <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center'>
                <Input.Text
                    placeholder={t('admin.users.search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                    }}
                    className='w-full sm:max-w-sm'
                />
                <Button asChild className='sm:ml-auto'>
                    <Link to='/users/new'>{t('admin.users.create')}</Link>
                </Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-300'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-300'>
                            <th className='px-4 py-3'>{t('admin.users.id')}</th>
                            <th className='px-4 py-3'>{t('admin.users.email')}</th>
                            <th className='px-4 py-3'>{t('admin.users.username')}</th>
                            <th className='px-4 py-3 text-center'>{t('admin.users.two_factor')}</th>
                            <th className='px-4 py-3 text-center'>{t('admin.users.servers_owned')}</th>
                            <th className='px-4 py-3 text-center'>{t('admin.users.can_access')}</th>
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
                                            {t('admin.users.admin_badge')}
                                        </span>
                                    )}
                                </td>
                                <td className='px-4 py-3 text-cream-100'>{user.username}</td>
                                <td className='px-4 py-3 text-center text-cream-400/70'>
                                    {user.use_totp ? t('common.enabled') : '—'}
                                </td>
                                <td className='px-4 py-3 text-center text-cream-100'>{user.servers_count}</td>
                                <td className='px-4 py-3 text-center text-cream-100'>{user.subuser_of_count}</td>
                            </tr>
                        ))}
                        {!isValidating && users.length === 0 && (
                            <tr>
                                <td colSpan={6} className='px-4 py-8 text-center text-cream-400/50'>
                                    {t('admin.users.empty')}
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
