import { NavLink, Outlet } from 'react-router-dom';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { cn } from '@/lib/utils';

interface Tab {
    label: string;
    to?: string;
    href?: string;
    end?: boolean;
}

// Branding is still served by the legacy page, so it gets a full page load
// rather than a client route.
const tabs: Tab[] = [
    { label: 'General', to: '/settings', end: true },
    { label: 'Mail', to: '/settings/mail' },
    { label: 'Captcha', to: '/settings/captcha' },
    { label: 'Domains', to: '/settings/domains' },
    { label: 'Custom Navigation', to: '/settings/custom-navigation' },
    { label: 'Branding', href: '/admin/settings/logo' },
    { label: 'Advanced', to: '/settings/advanced' },
];

const tabClass = 'rounded-lg px-3 py-1.5 text-sm transition-colors';

const SettingsLayout = () => (
    <PageContentBlock title='Settings'>
        <MainPageHeader direction='column' title='Settings'>
            <p className='text-sm text-neutral-400'>Configure your panel.</p>
        </MainPageHeader>

        <div className='mb-6 flex flex-wrap gap-1 rounded-xl border border-mocha-400 bg-mocha-500 p-1'>
            {tabs.map((tab) =>
                tab.href ? (
                    <a
                        key={tab.label}
                        href={tab.href}
                        className={cn(tabClass, 'text-cream-400/70 hover:bg-mocha-400 hover:text-cream-100')}
                    >
                        {tab.label}
                    </a>
                ) : (
                    <NavLink
                        key={tab.label}
                        to={tab.to as string}
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
                ),
            )}
        </div>

        <Outlet />
    </PageContentBlock>
);

export default SettingsLayout;
