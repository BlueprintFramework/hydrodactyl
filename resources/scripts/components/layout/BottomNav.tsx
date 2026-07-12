import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Fragment, memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import Can from '@/components/elements/Can';
import { cn } from '@/lib/utils';

export interface BottomNavItem {
    to: string;
    icon: IconSvgElement;
    text: string;
    minimizedText?: string;
    end?: boolean;
    permission?: string | string[];
}

interface BottomNavProps {
    items: BottomNavItem[];
}

// Mobile bottom navigation. Renders EVERY item in a horizontally-sliding
// (scrollable) row — no truncation, no "More" button. On a dashboard with few
// items they all fit; on a server page with many you slide left/right.
// Hides its scrollbar for a clean native "sliding tab" feel.
const BottomNav = memo(({ items }: BottomNavProps) => {
    const location = useLocation();

    if (items.length === 0) return null;

    const isActive = (to: string, end?: boolean) =>
        end ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`);

    return (
        <nav
            aria-label='Primary navigation'
            className='lg:hidden fixed inset-x-0 bottom-0 z-[9996] border-t border-mocha-400 bg-bg-lowered pb-[env(safe-area-inset-bottom)]'
        >
            <ul className='flex h-14 items-stretch gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                {items.map((item) => {
                    const active = isActive(item.to, item.end);
                    const label = item.minimizedText ?? item.text;
                    const itemEl = (
                        <li key={item.to} className='flex min-w-[72px] flex-1 items-stretch'>
                            <NavLink
                                to={item.to}
                                end={item.end}
                                aria-current={active ? 'page' : undefined}
                                className='group flex w-full flex-col items-center justify-center gap-1 py-2 touch-manipulation'
                            >
                                <HugeiconsIcon
                                    className={cn(
                                        'size-5 transition-colors',
                                        active ? 'text-brand' : 'text-white/55 group-hover:text-white',
                                    )}
                                    strokeWidth={2}
                                    icon={item.icon}
                                />
                                <span
                                    className={cn(
                                        'max-w-full truncate text-[10px] leading-none transition-colors',
                                        active ? 'font-semibold text-brand' : 'text-white/55 group-hover:text-white',
                                    )}
                                >
                                    {label}
                                </span>
                            </NavLink>
                        </li>
                    );

                    return item.permission ? (
                        <Can key={item.to} action={item.permission} matchAny>
                            {itemEl}
                        </Can>
                    ) : (
                        <Fragment key={item.to}>{itemEl}</Fragment>
                    );
                })}
            </ul>
        </nav>
    );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
