import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { memo } from 'react';
import { NavLink } from 'react-router-dom';

import Can from '@/components/elements/Can';

interface RenderedNavItem {
    to: string;
    icon: IconSvgElement;
    text: string;
    itemRef: React.RefObject<HTMLAnchorElement | null>;
    end: boolean;
    lastItem?: boolean;
    permission?: string | string[];
    onNavClick?: () => void;
}

const NavItem = memo(({ to, icon, text, itemRef, end, permission, onNavClick }: RenderedNavItem) => {
    const isExternal = /^https?:\/\//i.test(to);
    const className = 'nav-item flex items-center duration-200 select-none font-medium relative opacity-40 ';
    const content = (
        <>
            <HugeiconsIcon className='nav-icon size-5 shrink-0 transition-transform' strokeWidth={2} icon={icon} />
            <p className='nav-text text-sm text-nowrap transition-transform'>{text}</p>
        </>
    );
    const navLink = isExternal ? (
        <a
            href={to}
            className={className}
            ref={itemRef}
            draggable={false}
            onClick={onNavClick}
            target='_blank'
            rel='noreferrer'
        >
            {content}
        </a>
    ) : (
        <NavLink to={to} end={end} className={className} ref={itemRef} draggable={false} onClick={onNavClick}>
            {content}
        </NavLink>
    );

    // if permission specified, wrap in Can component
    if (permission) {
        return (
            <Can action={permission} matchAny>
                {navLink}
            </Can>
        );
    }

    return navLink;
});

NavItem.displayName = 'NavItem';

export default NavItem;
