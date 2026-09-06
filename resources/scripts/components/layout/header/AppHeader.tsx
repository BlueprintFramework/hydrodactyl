import { LayoutSideContent } from '@gravity-ui/icons';
import { Fragment, memo } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '@/components/elements/HydroLogo';
import { Button } from '@/components/ui/button';
import { useHeader } from '@/contexts/HeaderContext';
import { useSidebar } from '@/contexts/SidebarContext';

import { MobileSidebarToggle } from '../sidebar/MobileSidebar';
import '../sidebar/sidebar-modern.css';
import UserDropdown from './UserDropdown';

interface AppHeaderProps {
    serverId?: string;
}

const HeaderActions = memo(() => {
    const { headerActions } = useHeader();

    if (Array.isArray(headerActions)) {
        return (
            <>
                {headerActions.map((action, index) => (
                    <Fragment key={index}>{action}</Fragment>
                ))}
            </>
        );
    }

    return <>{headerActions}</>;
});

HeaderActions.displayName = 'HeaderActions';

const getSiteName = () => {
    const siteConfiguration = (window as Record<string, unknown>).SiteConfiguration as { name?: unknown } | undefined;

    return typeof siteConfiguration?.name === 'string' && siteConfiguration.name.trim().length > 0
        ? siteConfiguration.name
        : 'Hydrodactyl';
};

const LogoSection = memo(() => {
    const siteName = getSiteName();

    return (
        <NavLink
            to={'/'}
            className='sidebar-logo-link flex items-center shrink-0 h-8 min-w-0 gap-3 hydrodactyl-logo'
            aria-label={`${siteName} home page`}
        >
            <Logo className='flex h-8 w-8 shrink-0 object-contain' />
            <span className='sidebar-logo-name truncate text-sm font-semibold leading-none tracking-wide text-cream-50'>
                {siteName}
            </span>
        </NavLink>
    );
});
LogoSection.displayName = 'LogoSection';

const ToggleButton = memo(() => {
    const { toggleMinimized } = useSidebar();

    return (
        <Button
            variant={'secondary'}
            size={'sm'}
            className='sidebar-toggle-button p-1 gap-1 rounded-full size-8'
            aria-label='Toggle sidebar'
            onClick={toggleMinimized}
        >
            <LayoutSideContent width={16} height={16} />
        </Button>
    );
});
ToggleButton.displayName = 'ToggleButton';

const SidebarLogo = memo(() => {
    return (
        <div className='sidebar-logo-container hidden lg:flex h-12 items-center flex-none relative'>
            <LogoSection />
            <ToggleButton />
        </div>
    );
});
SidebarLogo.displayName = 'SidebarLogo';

const StaticButtons = memo<{ serverId?: string }>(({ serverId }) => {
    return <UserDropdown serverId={serverId} />;
});

StaticButtons.displayName = 'StaticButtons';

const SlotActions = memo<{ actions: React.ReactNode }>(({ actions }) => {
    if (!actions) return null;

    if (Array.isArray(actions)) {
        return (
            <>
                {actions.map((action, index) => (
                    <Fragment key={index}>{action}</Fragment>
                ))}
            </>
        );
    }

    return <>{actions}</>;
});
SlotActions.displayName = 'SlotActions';

const AppHeader = ({ serverId }: AppHeaderProps) => {
    const { leftActions, centerActions, rightActions } = useHeader();

    const hasSlottedLayout = leftActions || centerActions || rightActions;

    if (hasSlottedLayout) {
        return (
            <div className='h-16 w-full py-4 px-2 sm:px-4 flex items-center'>
                <div className='flex items-center gap-1.5 sm:gap-2 shrink-0'>
                    <MobileSidebarToggle />
                    <SidebarLogo />
                    <SlotActions actions={leftActions} />
                </div>
                <div className='flex-1 flex items-center justify-center min-w-0 px-2 sm:px-4'>
                    <SlotActions actions={centerActions} />
                </div>
                <div className='flex items-center gap-1.5 sm:gap-2 shrink-0'>
                    <SlotActions actions={rightActions} />
                    <StaticButtons serverId={serverId} />
                </div>
            </div>
        );
    }

    return (
        <div className='h-16 w-full py-4 pr-2 flex align-middle items-center justify-between'>
            <div className='flex items-center gap-2'>
                <MobileSidebarToggle />
                <SidebarLogo />
            </div>
            <div className='flex items-center gap-1.5 sm:gap-2 h-full justify-end min-w-0 overflow-hidden'>
                <HeaderActions />
                <StaticButtons serverId={serverId} />
            </div>
        </div>
    );
};

export default AppHeader;
