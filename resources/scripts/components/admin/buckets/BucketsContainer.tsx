import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useBuckets } from '@/api/admin/useBuckets';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

const BucketsContainer = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [search] = useDebounce(searchTerm, 300);

    const { data } = useBuckets({ page, search: search || undefined });
    const buckets = data?.items ?? [];

    return (
        <PageContentBlock title={t('admin.buckets.title')}>
            <MainPageHeader direction='column' title={t('admin.buckets.title')}>
                <p className='text-sm text-neutral-400'>{t('admin.buckets.description')}</p>
            </MainPageHeader>

            <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center'>
                <Input.Text
                    placeholder={t('admin.buckets.search_placeholder')}
                    value={searchTerm}
                    onChange={(event) => {
                        setSearchTerm(event.target.value);
                        setPage(1);
                    }}
                    className='w-full sm:max-w-sm'
                />
                <Button asChild className='sm:ml-auto'>
                    <Link to='/buckets/new'>{t('admin.buckets.create')}</Link>
                </Button>
            </div>

            <div className='overflow-x-auto rounded-xl border border-mocha-400'>
                <table className='w-full text-sm'>
                    <thead className='text-left text-xs uppercase tracking-wide text-cream-400/60'>
                        <tr className='border-b border-mocha-400'>
                            <th className='px-4 py-3'>{t('admin.common.id')}</th>
                            <th className='px-4 py-3'>{t('admin.common.name')}</th>
                            <th className='px-4 py-3'>{t('admin.buckets.bucket_name')}</th>
                            <th className='px-4 py-3'>{t('common.enabled')}</th>
                            <th className='px-4 py-3 text-center'>{t('admin.buckets.connected_servers')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {buckets.map((bucket) => (
                            <tr key={bucket.id} className='border-b border-mocha-400/40 hover:bg-mocha-400/20'>
                                <td className='px-4 py-3 font-mono text-cream-400/60'>{bucket.id}</td>
                                <td className='px-4 py-3'>
                                    <Link to={`/buckets/${bucket.id}`} className='text-cream-50 hover:text-hydro-400'>
                                        {bucket.name}
                                    </Link>
                                </td>
                                <td className='px-4 py-3'>
                                    <code className='text-xs text-cream-400/70'>{bucket.bucket_name}</code>
                                </td>
                                <td className='px-4 py-3'>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                            bucket.enabled
                                                ? 'bg-hydro-500/20 text-hydro-400'
                                                : 'bg-brand-400/20 text-brand-400'
                                        }`}
                                    >
                                        {bucket.enabled ? t('common.enabled') : t('common.disabled')}
                                    </span>
                                </td>
                                <td className='px-4 py-3 text-center text-cream-100'>{bucket.server_count}</td>
                            </tr>
                        ))}
                        {buckets.length === 0 && (
                            <tr>
                                <td colSpan={5} className='px-4 py-8 text-center text-cream-400/50'>
                                    {t('admin.buckets.empty')}
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

export default BucketsContainer;
