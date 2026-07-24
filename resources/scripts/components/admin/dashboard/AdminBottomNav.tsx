import {
    Activity02Icon,
    Archive01Icon,
    CubeIcon,
    Database02Icon,
    FolderIcon,
    GlobalIcon,
    NoteIcon,
    ServerStack02Icon,
    Settings02Icon,
    UserMultiple02Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { memo, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface AdminNavItem {
    to: string;
    icon: IconSvgElement;
    text: string;
    end?: boolean;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
    { to: '/admin', icon: Activity02Icon, text: 'Overview', end: true },
    { to: '/admin/servers', icon: ServerStack02Icon, text: 'Servers' },
    { to: '/admin/nodes', icon: Activity02Icon, text: 'Nodes' },
    { to: '/admin/users', icon: UserMultiple02Icon, text: 'Users' },
    { to: '/admin/databases', icon: Database02Icon, text: 'Databases' },
    { to: '/admin/nests', icon: CubeIcon, text: 'Nests' },
    { to: '/admin/locations', icon: GlobalIcon, text: 'Locations' },
    { to: '/admin/buckets', icon: Archive01Icon, text: 'Buckets' },
    { to: '/admin/mounts', icon: FolderIcon, text: 'Mounts' },
    { to: '/admin/api', icon: NoteIcon, text: 'API' },
    { to: '/admin/settings', icon: Settings02Icon, text: 'Settings' },
];

export const AdminBottomNav = memo(() => {
    const location = useLocation();

    const navItems = useMemo(() => ADMIN_NAV_ITEMS, []);

    const isActive = (to: string, end?: boolean) =>
        end ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`);

    return (
        <nav
            aria-label='Admin navigation'
            className='lg:hidden fixed inset-x-0 bottom-0 z-[9996] border-t border-mocha-400 bg-mocha-500/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]'
        >
            <ul className='flex h-12 sm:h-14 items-stretch gap-0.5 sm:gap-1 overflow-x-auto px-0.5 sm:px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                {navItems.map((item) => {
                    const active = isActive(item.to, item.end);

                    return (
                        <li key={item.to} className='flex min-w-[52px] sm:min-w-[64px] flex-1 items-stretch'>
                            <NavLink
                                to={item.to}
                                end={item.end}
                                aria-current={active ? 'page' : undefined}
                                className='group flex w-full flex-col items-center justify-center gap-1 py-2 touch-manipulation'
                            >
                                <HugeiconsIcon
                                    className={cn(
                                        'size-4 sm:size-5 transition-colors',
                                        active ? 'text-brand' : 'text-white/55 group-hover:text-white',
                                    )}
                                    strokeWidth={2}
                                    icon={item.icon}
                                />
                                <span
                                    className={cn(
                                        'max-w-full truncate text-[9px] sm:text-[10px] leading-none transition-colors',
                                        active ? 'font-semibold text-brand' : 'text-white/55 group-hover:text-white',
                                    )}
                                >
                                    {item.text}
                                </span>
                            </NavLink>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
});

AdminBottomNav.displayName = 'AdminBottomNav';
