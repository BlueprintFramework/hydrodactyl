import { forwardRef, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getSubdomainInfo } from '@/api/server/network/subdomain';

import Can from '@/components/elements/Can';
import { isFeatureLimitEnabled, isNetworkFeatureEnabled } from '@/lib/featureLimits';
import type { ServerRouteDefinition } from '@/routers/routes';

import { ServerContext } from '@/state/server';

interface ServerSidebarNavItemProps {
    route: ServerRouteDefinition;
    serverId: string;
    onClick?: () => void;
}

/**
 * A dynamic sidebar navigation item that handles:
 * - Permission checking via Can component
 * - Feature limit visibility (databases, backups, allocations)
 * - Network feature with subdomain support check
 */
const ServerSidebarNavItem = forwardRef<HTMLAnchorElement, ServerSidebarNavItemProps>(
    ({ route, serverId, onClick }, ref) => {
        const { icon: Icon, name, path, permission, featureLimit, end } = route;

        // Feature limits from server state
        const featureLimits = ServerContext.useStoreState((state) => state.server.data?.featureLimits);
        const eggFeatures = ServerContext.useStoreState((state) => state.server.data?.eggFeatures);
        const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);

        // State for subdomain support check (only for network route)
        const [subdomainSupported, setSubdomainSupported] = useState(false);

        // Check subdomain support for network feature
        useEffect(() => {
            if (featureLimit !== 'network' || !uuid) return;

            const checkSubdomainSupport = async () => {
                try {
                    const data = await getSubdomainInfo(uuid);
                    setSubdomainSupported(data.supported);
                } catch {
                    setSubdomainSupported(false);
                }
            };

            checkSubdomainSupport();
        }, [featureLimit, uuid]);

        // Check if the item should be visible based on feature limits
        const isVisible = (): boolean => {
            if (!featureLimit) return true;

            if (featureLimit === 'network') {
                return isNetworkFeatureEnabled(featureLimits?.allocations, subdomainSupported);
            }

            return isFeatureLimitEnabled(featureLimits?.[featureLimit]);
        };

        // Don't render if feature limit hides this item
        if (!isVisible()) return null;

        // Hide when an egg-feature gate is defined and the server's egg doesn't
        // advertise a matching feature (e.g. the installer on a non-Minecraft server).
        if (route.eggFeature && !(eggFeatures ?? []).some((feature) => route.eggFeature?.test(feature))) {
            return null;
        }

        // Build the navigation link
        const to = path ? `/server/${serverId}/${path}` : `/server/${serverId}`;

        const NavContent = (
            <NavLink
                ref={ref}
                to={to}
                end={end}
                onClick={onClick}
                className='flex flex-row items-center transition-colors duration-200 hover:bg-[#ffffff11] rounded-md'
            >
                {Icon && <Icon className='ml-3' width={22} height={22} fill='currentColor' />}
                <p>{name}</p>
            </NavLink>
        );

        // If permission is null or undefined, render without permission check
        if (permission === null || permission === undefined) {
            return NavContent;
        }

        // Wrap with permission check
        return (
            <Can action={permission} matchAny>
                {NavContent}
            </Can>
        );
    },
);

ServerSidebarNavItem.displayName = 'ServerSidebarNavItem';

export default ServerSidebarNavItem;
