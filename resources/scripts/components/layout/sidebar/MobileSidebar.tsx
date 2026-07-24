import { Menu02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { memo, type RefObject, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import Logo from '@/components/elements/HydroLogo';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

import NavItem from './NavItem';
import './sidebar-logo.css';
import './sidebar-modern.css';

interface NavItemData {
    to: string;
    icon: IconSvgElement;
    text: string;
    minimizedText?: string;
    tabName: string;
    ref: RefObject<HTMLAnchorElement | null>;
    end: boolean;
    permission?: string | string[];
}

interface MobileSidebarProps {
    navItems: NavItemData[];
}

const MobileSidebarPanel = memo<{ navItems: NavItemData[] }>(({ navItems }) => {
    const { setMobileOpen, isMobileOpen } = useSidebar();
    const location = useLocation();
    const [shouldRender, _setShouldRender] = useState(false);
    const [isAnimating, _setIsAnimating] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // biome-ignore lint/correctness/useExhaustiveDependencies: close menu on route change; setMobileOpen is stable
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname, setMobileOpen]);

    useEffect(() => {
        if (!isMobileOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMobileOpen]);

    if (!shouldRender) return null;

    return (
        <div className='lg:hidden fixed inset-0 z-[9999]'>
            <button
                type='button'
                className={cn(
                    'absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default transition-opacity duration-300',
                    isAnimating ? 'opacity-100' : 'opacity-0',
                )}
                onClick={() => setMobileOpen(false)}
                aria-label='Close menu'
                aria-hidden='true'
                tabIndex={-1}
            />

            <div
                ref={panelRef}
                className={cn(
                    'sidebar-container absolute top-0 left-0 h-full w-[300px] max-w-[85vw] shrink-0',
                    'flex flex-col bg-bg-lowered border-r border-mocha-400',
                    'rounded-none overflow-y-auto overflow-x-hidden',
                    'transition-transform duration-300 ease-out',
                    isAnimating ? 'translate-x-0' : '-translate-x-full',
                )}
                data-sidebar-minimized='false'
            >
                <div className='mobile-sidebar-logo h-16 flex items-center flex-none'>
                    <NavLink
                        to='/'
                        className='flex h-8 w-fit shrink-0 items-center hydrodactyl-logo'
                        aria-label='Hydrodactyl home page'
                    >
                        <Logo className='h-8 w-8 shrink-0 object-contain' />
                    </NavLink>
                </div>

                <ul className='flex flex-col text-sm'>
                    {navItems.map((item, index) => (
                        <li key={item.tabName} data-tab={item.tabName}>
                            <NavItem
                                to={item.to}
                                icon={item.icon}
                                text={item.text}
                                itemRef={item.ref}
                                end={item.end}
                                lastItem={index === navItems.length - 1}
                                permission={item.permission}
                                onNavClick={() => setMobileOpen(false)}
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
});

MobileSidebarPanel.displayName = 'MobileSidebarPanel';

const MobileSidebarToggle = memo(() => {
    const { toggleMobile } = useSidebar();

    return (
        <button
            type='button'
            onClick={toggleMobile}
            className='lg:hidden p-1 rounded-full hover:bg-mocha-400 transition shrink-0'
            aria-label='Open menu'
        >
            <HugeiconsIcon size={20} strokeWidth={2} icon={Menu02Icon} />
        </button>
    );
});

MobileSidebarToggle.displayName = 'MobileSidebarToggle';

export default function MobileSidebar({ navItems }: MobileSidebarProps) {
    return <MobileSidebarPanel navItems={navItems} />;
}

export { MobileSidebarToggle };
