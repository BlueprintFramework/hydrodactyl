import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useBucket } from '@/api/admin/useBuckets';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { useTranslation } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

const tabClass = 'rounded-lg px-3 py-1.5 text-sm transition-colors';

const BucketLayout = () => {
    const { t } = useTranslation();
    const { id } = useParams<'id'>();
    const { data: bucket, error, isLoading } = useBucket(id);

    if (isLoading) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    if (error || !bucket) {
        return (
            <PageContentBlock title={t('admin.buckets.title_singular')}>
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-8 text-center text-sm text-cream-400/60'>
                    {t('admin.buckets.not_found')}
                </div>
            </PageContentBlock>
        );
    }

    const base = `/buckets/${bucket.id}`;
    const tabs = [
        { label: t('admin.buckets.tab_about'), to: base, end: true },
        { label: t('admin.buckets.tab_details'), to: `${base}/details`, end: false },
        { label: t('admin.buckets.tab_servers'), to: `${base}/servers`, end: false },
        { label: t('admin.buckets.tab_delete'), to: `${base}/delete`, end: false },
    ];

    return (
        <PageContentBlock title={bucket.name}>
            <MainPageHeader direction='column' title={bucket.name}>
                <p className='text-sm text-neutral-400'>
                    {bucket.description || t('admin.buckets.fallback_description')}
                </p>
            </MainPageHeader>

            <div className='mb-6 flex flex-wrap gap-1 rounded-xl border border-mocha-400 bg-mocha-500 p-1'>
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.label}
                        to={tab.to}
                        end={tab.end}
                        className={({ isActive }) =>
                            cn(
                                tabClass,
                                isActive
                                    ? 'bg-hydro-500/15 font-medium text-hydro-400'
                                    : 'text-cream-400/70 hover:bg-mocha-400 hover:text-cream-100',
                            )
                        }
                    >
                        {tab.label}
                    </NavLink>
                ))}
            </div>

            <Outlet />
        </PageContentBlock>
    );
};

export default BucketLayout;
