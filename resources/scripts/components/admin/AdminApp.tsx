import GlobalStylesheet from '@/assets/css/GlobalStylesheet';
import '@/assets/tailwind.css';
import '@preact/signals-react';
import {
    Database02Icon,
    Folder01Icon,
    Home01Icon,
    Key01Icon,
    Location01Icon,
    Package01Icon,
    ServerStack01Icon,
    ServerStack02Icon,
    Settings02Icon,
    Store01Icon,
    UserMultiple02Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { StoreProvider } from 'easy-peasy';
import { type RefObject, Suspense, useRef } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainWrapper from '@/components/elements/MainWrapper';
import { NotFound } from '@/components/elements/ScreenBlock';
import HydrodactylProvider from '@/components/HydrodactylProvider';
import BottomNav from '@/components/layout/BottomNav';
import AppHeader from '@/components/layout/header/AppHeader';
import MobileSidebar from '@/components/layout/sidebar/MobileSidebar';
import Sidebar from '@/components/layout/sidebar/Sidebar';
import { HeaderProvider } from '@/contexts/HeaderContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { store } from '@/state';
import type { SiteSettings } from '@/state/settings';

import OverviewContainer from './containers/OverviewContainer';

interface ExtendedWindow extends Window {
    SiteConfiguration?: SiteSettings;
    HydrodactylUser?: {
        uuid: string;
        username: string;
        email: string;

        root_admin: boolean;
        use_totp: boolean;
        language: string;
        updated_at: string;
        created_at: string;
    };
}

interface AdminNavItem {
    to: string;
    icon: IconSvgElement;
    text: string;
    minimizedText?: string;
    tabName: string;
    ref: RefObject<HTMLAnchorElement | null>;
    end: boolean;
    // Sections that have not been rebuilt yet are still served by the legacy
    // AdminLTE pages, so they need a full page load instead of a client route.
    hardNav?: boolean;
}

const AdminShell = () => {
    const NavigationOverview = useRef<HTMLAnchorElement>(null);
    const NavigationServers = useRef<HTMLAnchorElement>(null);
    const NavigationUsers = useRef<HTMLAnchorElement>(null);
    const NavigationNodes = useRef<HTMLAnchorElement>(null);
    const NavigationLocations = useRef<HTMLAnchorElement>(null);
    const NavigationDatabases = useRef<HTMLAnchorElement>(null);
    const NavigationBuckets = useRef<HTMLAnchorElement>(null);
    const NavigationNests = useRef<HTMLAnchorElement>(null);
    const NavigationMounts = useRef<HTMLAnchorElement>(null);
    const NavigationSettings = useRef<HTMLAnchorElement>(null);
    const NavigationApi = useRef<HTMLAnchorElement>(null);

    const navItems: AdminNavItem[] = [
        {
            to: '/',
            icon: Home01Icon,
            text: 'Overview',
            tabName: 'overview',
            ref: NavigationOverview,
            end: true,
        },
        {
            to: '/admin/servers',
            icon: ServerStack02Icon,
            text: 'Servers',
            tabName: 'servers',
            ref: NavigationServers,
            end: false,
            hardNav: true,
        },
        {
            to: '/admin/users',
            icon: UserMultiple02Icon,
            text: 'Users',
            tabName: 'users',
            ref: NavigationUsers,
            end: false,
            hardNav: true,
        },
        {
            to: '/admin/nodes',
            icon: ServerStack01Icon,
            text: 'Nodes',
            tabName: 'nodes',
            ref: NavigationNodes,
            end: false,
            hardNav: true,
        },
        {
            to: '/admin/locations',
            icon: Location01Icon,
            text: 'Locations',
            tabName: 'locations',
            ref: NavigationLocations,
            end: false,
            hardNav: true,
        },
        {
            to: '/admin/databases',
            icon: Database02Icon,
            text: 'Databases',
            tabName: 'databases',
            ref: NavigationDatabases,
            end: false,
            hardNav: true,
        },
        {
            to: '/admin/buckets',
            icon: Store01Icon,
            text: 'S3 Buckets',
            minimizedText: 'Buckets',
            tabName: 'buckets',
            ref: NavigationBuckets,
            end: false,
            hardNav: true,
        },
        {
            to: '/admin/nests',
            icon: Package01Icon,
            text: 'Nests',
            tabName: 'nests',
            ref: NavigationNests,
            end: false,
            hardNav: true,
        },
        {
            to: '/admin/mounts',
            icon: Folder01Icon,
            text: 'Mounts',
            tabName: 'mounts',
            ref: NavigationMounts,
            end: false,
            hardNav: true,
        },
        {
            to: '/admin/settings',
            icon: Settings02Icon,
            text: 'Settings',
            tabName: 'settings',
            ref: NavigationSettings,
            end: false,
            hardNav: true,
        },
        {
            to: '/admin/api',
            icon: Key01Icon,
            text: 'Application API',
            minimizedText: 'API',
            tabName: 'api',
            ref: NavigationApi,
            end: false,
            hardNav: true,
        },
    ];

    return (
        <SidebarProvider>
            <HeaderProvider>
                <div className='flex flex-col w-full h-full relative'>
                    <AppHeader admin />
                    <div className='flex flex-col lg:flex-row h-full w-full overflow-hidden relative'>
                        <Sidebar navItems={navItems} bottomNavItems={[]} className='hidden lg:flex' />
                        <MobileSidebar navItems={navItems} />
                        <BottomNav items={navItems} />
                        <MainWrapper>
                            <Suspense fallback={null}>
                                <Routes>
                                    <Route path='/' element={<OverviewContainer />} />
                                    <Route path='*' element={<NotFound />} />
                                </Routes>
                            </Suspense>
                        </MainWrapper>
                    </div>
                </div>
            </HeaderProvider>
        </SidebarProvider>
    );
};

const AdminApp = () => {
    const { HydrodactylUser, SiteConfiguration } = window as ExtendedWindow;
    if (HydrodactylUser && !store.getState().user.data) {
        store.getActions().user.setUserData({
            uuid: HydrodactylUser.uuid,
            username: HydrodactylUser.username,
            email: HydrodactylUser.email,
            language: HydrodactylUser.language,
            rootAdmin: HydrodactylUser.root_admin,
            useTotp: HydrodactylUser.use_totp,
            createdAt: new Date(HydrodactylUser.created_at),
            updatedAt: new Date(HydrodactylUser.updated_at),
        });
    }

    if (!store.getState().settings.data) {
        if (SiteConfiguration) {
            store.getActions().settings.setSettings(SiteConfiguration);
        }
    }

    return (
        <>
            <GlobalStylesheet />
            <StoreProvider store={store}>
                <HydrodactylProvider>
                    <div
                        data-hydrodactyl-routerwrap=''
                        className='relative w-full h-full flex flex-row p-2 overflow-hidden rounded-lg'
                    >
                        <BrowserRouter basename='/admin'>
                            <AdminShell />
                        </BrowserRouter>
                    </div>
                </HydrodactylProvider>
            </StoreProvider>
        </>
    );
};

export default AdminApp;
