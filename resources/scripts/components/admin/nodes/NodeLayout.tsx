import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useNode } from '@/api/admin/useNodes';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { useTranslation } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

const tabClass = 'rounded-lg px-3 py-1.5 text-sm transition-colors';

const NodeLayout = () => {
    const { t } = useTranslation();
    const { id } = useParams<'id'>();
    const { data: node, error, isLoading } = useNode(id);

    if (isLoading) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    if (error || !node) {
        return (
            <PageContentBlock title={t('admin.nodes.title_singular')}>
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-8 text-center text-sm text-cream-400/60'>
                    {t('admin.nodes.not_found')}
                </div>
            </PageContentBlock>
        );
    }

    const base = `/nodes/${node.id}`;
    const tabs = [
        { label: t('admin.nodes.tab_about'), to: base, end: true },
        { label: t('admin.nodes.tab_settings'), to: `${base}/settings`, end: false },
        { label: t('admin.nodes.tab_configuration'), to: `${base}/configuration`, end: false },
        { label: t('admin.nodes.tab_allocation'), to: `${base}/allocation`, end: false },
        { label: t('admin.nodes.tab_servers'), to: `${base}/servers`, end: false },
    ];

    return (
        <PageContentBlock title={node.name}>
            <MainPageHeader direction='column' title={node.name}>
                <p className='text-sm text-neutral-400'>{node.fqdn}</p>
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

export default NodeLayout;
