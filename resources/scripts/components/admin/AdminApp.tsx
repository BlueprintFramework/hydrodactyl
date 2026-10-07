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
import { lazy, type RefObject, Suspense, useRef } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
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

const UsersContainer = lazy(() => import('./users/UsersContainer'));
const UserCreateContainer = lazy(() => import('./users/UserCreateContainer'));
const UserViewContainer = lazy(() => import('./users/UserViewContainer'));

const NodesContainer = lazy(() => import('./nodes/NodesContainer'));
const NodeCreateContainer = lazy(() => import('./nodes/NodeCreateContainer'));
const NodeLayout = lazy(() => import('./nodes/NodeLayout'));
const NodeOverviewContainer = lazy(() => import('./nodes/NodeOverviewContainer'));
const NodeSettingsContainer = lazy(() => import('./nodes/NodeSettingsContainer'));
const NodeConfigurationContainer = lazy(() => import('./nodes/NodeConfigurationContainer'));
const NodeAllocationContainer = lazy(() => import('./nodes/NodeAllocationContainer'));
const NodeServersContainer = lazy(() => import('./nodes/NodeServersContainer'));

const LocationsContainer = lazy(() => import('./locations/LocationsContainer'));
const LocationViewContainer = lazy(() => import('./locations/LocationViewContainer'));

const DatabaseHostsContainer = lazy(() => import('./databases/DatabaseHostsContainer'));
const DatabaseHostViewContainer = lazy(() => import('./databases/DatabaseHostViewContainer'));

const ServersContainer = lazy(() => import('./servers/ServersContainer'));
const ServerLayout = lazy(() => import('./servers/ServerLayout'));
const ServerOverviewContainer = lazy(() => import('./servers/ServerOverviewContainer'));
const ServerDetailsContainer = lazy(() => import('./servers/ServerDetailsContainer'));
const ServerBuildContainer = lazy(() => import('./servers/ServerBuildContainer'));
const ServerStartupContainer = lazy(() => import('./servers/ServerStartupContainer'));
const ServerDatabaseContainer = lazy(() => import('./servers/ServerDatabaseContainer'));
const ServerMountsContainer = lazy(() => import('./servers/ServerMountsContainer'));
const ServerCreateContainer = lazy(() => import('./servers/ServerCreateContainer'));

const MountsContainer = lazy(() => import('./mounts/MountsContainer'));
const MountViewContainer = lazy(() => import('./mounts/MountViewContainer'));

const ApplicationApiContainer = lazy(() => import('./application-api/ApplicationApiContainer'));
const ApplicationApiCreateContainer = lazy(() => import('./application-api/ApplicationApiCreateContainer'));

const NestsContainer = lazy(() => import('./nests/NestsContainer'));
const NestCreateContainer = lazy(() => import('./nests/NestCreateContainer'));
const NestViewContainer = lazy(() => import('./nests/NestViewContainer'));
const EggLayout = lazy(() => import('./nests/EggLayout'));
const EggConfigurationContainer = lazy(() => import('./nests/EggConfigurationContainer'));
const EggCreateContainer = lazy(() => import('./nests/EggCreateContainer'));
const EggVariablesContainer = lazy(() => import('./nests/EggVariablesContainer'));
const EggScriptsContainer = lazy(() => import('./nests/EggScriptsContainer'));

const BucketsContainer = lazy(() => import('./buckets/BucketsContainer'));
const BucketCreateContainer = lazy(() => import('./buckets/BucketCreateContainer'));
const BucketLayout = lazy(() => import('./buckets/BucketLayout'));
const BucketOverviewContainer = lazy(() => import('./buckets/BucketOverviewContainer'));
const BucketDetailsContainer = lazy(() => import('./buckets/BucketDetailsContainer'));
const BucketServersContainer = lazy(() => import('./buckets/BucketServersContainer'));
const BucketDeleteContainer = lazy(() => import('./buckets/BucketDeleteContainer'));
const ServerManageContainer = lazy(() => import('./servers/ServerManageContainer'));
const ServerDeleteContainer = lazy(() => import('./servers/ServerDeleteContainer'));

const SettingsLayout = lazy(() => import('./settings/SettingsLayout'));
const GeneralSettings = lazy(() => import('./settings/GeneralSettings'));
const AdvancedSettings = lazy(() => import('./settings/AdvancedSettings'));
const MailSettings = lazy(() => import('./settings/MailSettings'));
const CaptchaSettings = lazy(() => import('./settings/CaptchaSettings'));
const CustomNavigationSettings = lazy(() => import('./settings/CustomNavigationSettings'));
const DomainsContainer = lazy(() => import('./settings/domains/DomainsContainer'));
const DomainFormContainer = lazy(() => import('./settings/domains/DomainFormContainer'));
const BrandingSettings = lazy(() => import('./settings/BrandingSettings'));

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
            to: '/servers',
            icon: ServerStack02Icon,
            text: 'Servers',
            tabName: 'servers',
            ref: NavigationServers,
            end: false,
        },
        {
            to: '/users',
            icon: UserMultiple02Icon,
            text: 'Users',
            tabName: 'users',
            ref: NavigationUsers,
            end: false,
        },
        {
            to: '/nodes',
            icon: ServerStack01Icon,
            text: 'Nodes',
            tabName: 'nodes',
            ref: NavigationNodes,
            end: false,
        },
        {
            to: '/locations',
            icon: Location01Icon,
            text: 'Locations',
            tabName: 'locations',
            ref: NavigationLocations,
            end: false,
        },
        {
            to: '/databases',
            icon: Database02Icon,
            text: 'Databases',
            tabName: 'databases',
            ref: NavigationDatabases,
            end: false,
        },
        {
            to: '/buckets',
            icon: Store01Icon,
            text: 'S3 Buckets',
            minimizedText: 'Buckets',
            tabName: 'buckets',
            ref: NavigationBuckets,
            end: false,
        },
        {
            to: '/nests',
            icon: Package01Icon,
            text: 'Nests',
            tabName: 'nests',
            ref: NavigationNests,
            end: false,
        },
        {
            to: '/mounts',
            icon: Folder01Icon,
            text: 'Mounts',
            tabName: 'mounts',
            ref: NavigationMounts,
            end: false,
        },
        {
            to: '/settings',
            icon: Settings02Icon,
            text: 'Settings',
            tabName: 'settings',
            ref: NavigationSettings,
            end: false,
        },
        {
            to: '/api',
            icon: Key01Icon,
            text: 'Application API',
            minimizedText: 'API',
            tabName: 'api',
            ref: NavigationApi,
            end: false,
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
                                    <Route path='/users' element={<UsersContainer />} />
                                    <Route path='/users/new' element={<UserCreateContainer />} />
                                    <Route path='/users/:id' element={<UserViewContainer />} />
                                    <Route path='/nodes' element={<NodesContainer />} />
                                    <Route path='/nodes/new' element={<NodeCreateContainer />} />
                                    <Route path='/nodes/:id' element={<NodeLayout />}>
                                        <Route index element={<NodeOverviewContainer />} />
                                        <Route path='settings' element={<NodeSettingsContainer />} />
                                        <Route path='configuration' element={<NodeConfigurationContainer />} />
                                        <Route path='allocation' element={<NodeAllocationContainer />} />
                                        <Route path='servers' element={<NodeServersContainer />} />
                                    </Route>
                                    <Route path='/locations' element={<LocationsContainer />} />
                                    <Route path='/locations/:id' element={<LocationViewContainer />} />
                                    <Route path='/databases' element={<DatabaseHostsContainer />} />
                                    <Route path='/databases/:id' element={<DatabaseHostViewContainer />} />
                                    <Route path='/servers' element={<ServersContainer />} />
                                    <Route path='/servers/new' element={<ServerCreateContainer />} />
                                    <Route path='/servers/:id' element={<ServerLayout />}>
                                        <Route index element={<ServerOverviewContainer />} />
                                        <Route path='details' element={<ServerDetailsContainer />} />
                                        <Route path='build' element={<ServerBuildContainer />} />
                                        <Route path='startup' element={<ServerStartupContainer />} />
                                        <Route path='database' element={<ServerDatabaseContainer />} />
                                        <Route path='mounts' element={<ServerMountsContainer />} />
                                        <Route path='manage' element={<ServerManageContainer />} />
                                        <Route path='delete' element={<ServerDeleteContainer />} />
                                    </Route>
                                    <Route path='/mounts' element={<MountsContainer />} />
                                    <Route path='/mounts/:id' element={<MountViewContainer />} />
                                    <Route path='/api' element={<ApplicationApiContainer />} />
                                    <Route path='/api/new' element={<ApplicationApiCreateContainer />} />
                                    <Route path='/nests' element={<NestsContainer />} />
                                    <Route path='/nests/new' element={<NestCreateContainer />} />
                                    <Route path='/nests/:id' element={<NestViewContainer />} />
                                    <Route path='/eggs/new' element={<EggCreateContainer />} />
                                    <Route path='/eggs/:id' element={<EggLayout />}>
                                        <Route index element={<EggConfigurationContainer />} />
                                        <Route path='variables' element={<EggVariablesContainer />} />
                                        <Route path='scripts' element={<EggScriptsContainer />} />
                                    </Route>
                                    <Route path='/buckets' element={<BucketsContainer />} />
                                    <Route path='/buckets/new' element={<BucketCreateContainer />} />
                                    <Route path='/buckets/:id' element={<BucketLayout />}>
                                        <Route index element={<BucketOverviewContainer />} />
                                        <Route path='details' element={<BucketDetailsContainer />} />
                                        <Route path='servers' element={<BucketServersContainer />} />
                                        <Route path='delete' element={<BucketDeleteContainer />} />
                                    </Route>
                                    <Route path='/settings' element={<SettingsLayout />}>
                                        <Route index element={<GeneralSettings />} />
                                        <Route path='advanced' element={<AdvancedSettings />} />
                                        <Route path='mail' element={<MailSettings />} />
                                        <Route path='captcha' element={<CaptchaSettings />} />
                                        <Route path='custom-navigation' element={<CustomNavigationSettings />} />
                                        <Route path='domains' element={<DomainsContainer />} />
                                        <Route path='domains/new' element={<DomainFormContainer />} />
                                        <Route path='domains/:id' element={<DomainFormContainer />} />
                                        <Route path='logo' element={<BrandingSettings />} />
                                    </Route>
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
                        <Toaster
                            theme='dark'
                            toastOptions={{
                                unstyled: true,
                                classNames: {
                                    toast: 'p-4 bg-[#ffffff09] border border-[#ffffff12] rounded-2xl shadow-lg backdrop-blur-2xl flex items-center w-full gap-2',
                                },
                            }}
                        />
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
