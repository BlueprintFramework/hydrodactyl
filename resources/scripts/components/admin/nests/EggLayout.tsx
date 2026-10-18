import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useEgg } from '@/api/admin/useNests';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { useTranslation } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

const tabClass = 'rounded-lg px-3 py-1.5 text-sm transition-colors';

const EggLayout = () => {
    const { t } = useTranslation();
    const { id } = useParams<'id'>();
    const { data: response, error, isLoading } = useEgg(id);

    if (isLoading) {
        return (
            <div className='flex min-h-[60vh] items-center justify-center'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const egg = response?.data;

    if (error || !egg) {
        return (
            <PageContentBlock title={t('admin.nests.title_singular')}>
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-8 text-center text-sm text-cream-400/60'>
                    {t('admin.nests.not_found')}
                </div>
            </PageContentBlock>
        );
    }

    const base = `/eggs/${egg.id}`;
    const tabs = [
        { label: t('admin.nests.tab_configuration'), to: base, end: true },
        { label: t('admin.nests.tab_variables'), to: `${base}/variables`, end: false },
        { label: t('admin.nests.tab_scripts'), to: `${base}/scripts`, end: false },
    ];

    const classes = ({ isActive }: { isActive: boolean }) =>
        cn(
            tabClass,
            isActive
                ? 'bg-hydro-500/15 font-medium text-hydro-400'
                : 'text-cream-400/70 hover:bg-mocha-400 hover:text-cream-100',
        );

    return (
        <PageContentBlock title={egg.name}>
            <MainPageHeader direction='column' title={egg.name}>
                <p className='text-sm text-neutral-400'>
                    {egg.description || egg.nest?.name || t('admin.nests.title_singular')}
                </p>
            </MainPageHeader>

            <div className='mb-6 flex flex-wrap items-center gap-1 rounded-xl border border-mocha-400 bg-mocha-500 p-1'>
                {tabs.map((tab) => (
                    <NavLink key={tab.label} to={tab.to} end={tab.end} className={classes}>
                        {tab.label}
                    </NavLink>
                ))}
            </div>

            <Outlet />
        </PageContentBlock>
    );
};

export default EggLayout;
