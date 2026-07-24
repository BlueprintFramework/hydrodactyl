import { Archive, Cube, Database, Folder, Gear, Globe, Key, Persons, Pulse, Server } from '@gravity-ui/icons';
import type { ComponentType, SVGProps } from 'react';
import { memo, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface AdminNavItem {
    to: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    text: string;
    end?: boolean;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
    { to: '/admin', icon: Pulse, text: 'Overview', end: true },
    { to: '/admin/servers', icon: Server, text: 'Servers' },
    { to: '/admin/nodes', icon: Pulse, text: 'Nodes' },
    { to: '/admin/users', icon: Persons, text: 'Users' },
    { to: '/admin/databases', icon: Database, text: 'Databases' },
    { to: '/admin/nests', icon: Cube, text: 'Nests' },
    { to: '/admin/locations', icon: Globe, text: 'Locations' },
    { to: '/admin/buckets', icon: Archive, text: 'Buckets' },
    { to: '/admin/mounts', icon: Folder, text: 'Mounts' },
    { to: '/admin/api', icon: Key, text: 'API' },
    { to: '/admin/settings', icon: Gear, text: 'Settings' },
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
                    const Icon = item.icon;

                    return (
                        <li key={item.to} className='flex min-w-[52px] sm:min-w-[64px] flex-1 items-stretch'>
                            <NavLink
                                to={item.to}
                                end={item.end}
                                aria-current={active ? 'page' : undefined}
                                className='group flex w-full flex-col items-center justify-center gap-1 py-2 touch-manipulation'
                            >
                                <Icon
                                    className={cn(
                                        'size-4 sm:size-5 transition-colors',
                                        active ? 'text-brand' : 'text-white/55 group-hover:text-white',
                                    )}
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
