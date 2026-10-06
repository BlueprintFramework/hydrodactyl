import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useServer } from '@/api/admin/useServers';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { cn } from '@/lib/utils';

const tabClass = 'rounded-lg px-3 py-1.5 text-sm transition-colors';

const ServerLayout = () => {
    const { id } = useParams<'id'>();
    const { data: server, error, isLoading } = useServer(id);

    if (isLoading) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    if (error || !server) {
        return (
            <PageContentBlock title='Server'>
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-8 text-center text-sm text-cream-400/60'>
                    That server could not be found.
                </div>
            </PageContentBlock>
        );
    }

    const base = `/servers/${server.id}`;
    const tabs = [
        { label: 'About', to: base, end: true },
        ...(server.is_installed
            ? [
                  { label: 'Details', to: `${base}/details`, end: false },
                  { label: 'Build Configuration', to: `${base}/build`, end: false },
                  { label: 'Startup', href: `/admin/servers/view/${server.id}/startup` },
                  { label: 'Database', href: `/admin/servers/view/${server.id}/database` },
                  { label: 'Mounts', href: `/admin/servers/view/${server.id}/mounts` },
              ]
            : []),
        { label: 'Manage', to: `${base}/manage`, end: false },
        { label: 'Delete', to: `${base}/delete`, end: false },
    ];

    const classes = ({ isActive }: { isActive: boolean }) =>
        cn(
            tabClass,
            isActive
                ? 'bg-hydro-500/15 font-medium text-hydro-400'
                : 'text-cream-400/70 hover:bg-mocha-400 hover:text-cream-100',
        );

    return (
        <PageContentBlock title={server.name}>
            <MainPageHeader direction='column' title={server.name}>
                <p className='text-sm text-neutral-400'>{server.description || `Server ${server.uuid_short}`}</p>
            </MainPageHeader>

            <div className='mb-6 flex flex-wrap items-center gap-1 rounded-xl border border-mocha-400 bg-mocha-500 p-1'>
                {tabs.map((tab) =>
                    'href' in tab && tab.href ? (
                        <a
                            key={tab.label}
                            href={tab.href}
                            className={cn(tabClass, 'text-cream-400/70 hover:bg-mocha-400 hover:text-cream-100')}
                        >
                            {tab.label}
                        </a>
                    ) : (
                        <NavLink key={tab.label} to={tab.to as string} end={tab.end} className={classes}>
                            {tab.label}
                        </NavLink>
                    ),
                )}
                <a
                    href={`/server/${server.uuid_short}`}
                    className={cn(tabClass, 'ml-auto text-hydro-400 hover:bg-mocha-400 hover:text-hydro-300')}
                >
                    Open Console ↗
                </a>
            </div>

            <Outlet />
        </PageContentBlock>
    );
};

export default ServerLayout;
