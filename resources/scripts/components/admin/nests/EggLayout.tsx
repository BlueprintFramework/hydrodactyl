import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useEgg } from '@/api/admin/useNests';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { cn } from '@/lib/utils';

const tabClass = 'rounded-lg px-3 py-1.5 text-sm transition-colors';

const EggLayout = () => {
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
            <PageContentBlock title='Egg'>
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-8 text-center text-sm text-cream-400/60'>
                    That egg could not be found.
                </div>
            </PageContentBlock>
        );
    }

    const base = `/eggs/${egg.id}`;
    const tabs = [
        { label: 'Configuration', to: base, end: true },
        { label: 'Variables', to: `${base}/variables`, end: false },
        { label: 'Install Script', to: `${base}/scripts`, end: false },
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
                <p className='text-sm text-neutral-400'>{egg.description || egg.nest?.name || 'Egg'}</p>
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
