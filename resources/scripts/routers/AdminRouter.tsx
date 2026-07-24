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
import { Suspense, useMemo } from 'react';
import { Route, Routes } from 'react-router-dom';
import AdminDashboardContainer from '@/components/admin/AdminDashboardContainer';
import AdminApiContainer from '@/components/admin/api/AdminApiContainer';
import AdminBucketsContainer from '@/components/admin/buckets/AdminBucketsContainer';
import { AdminBottomNav } from '@/components/admin/dashboard';
import AdminDatabasesContainer from '@/components/admin/databases/AdminDatabasesContainer';
import AdminLocationsContainer from '@/components/admin/locations/AdminLocationsContainer';
import AdminMountsContainer from '@/components/admin/mounts/AdminMountsContainer';
import AdminNestsContainer from '@/components/admin/nests/AdminNestsContainer';
import AdminNodesContainer from '@/components/admin/nodes/AdminNodesContainer';
import AdminServersContainer from '@/components/admin/servers/AdminServersContainer';
import AdminSettingsContainer from '@/components/admin/settings/AdminSettingsContainer';
import AdminUsersContainer from '@/components/admin/users/AdminUsersContainer';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import AppHeader from '@/components/layout/header/AppHeader';
import MobileSidebar from '@/components/layout/sidebar/MobileSidebar';
import Sidebar from '@/components/layout/sidebar/Sidebar';
import { HeaderProvider } from '@/contexts/HeaderContext';
import { SidebarProvider } from '@/contexts/SidebarContext';

const AdminRouter = () => {
    const navItems = useMemo(
        () => [
            {
                to: '/admin',
                icon: Activity02Icon,
                text: 'Overview',
                tabName: 'overview',
                ref: { current: null },
                end: true,
            },
            {
                to: '/admin/settings',
                icon: Settings02Icon,
                text: 'Settings',
                tabName: 'settings',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/api',
                icon: NoteIcon,
                text: 'API',
                tabName: 'api',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/buckets',
                icon: Archive01Icon,
                text: 'S3 Buckets',
                tabName: 'buckets',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/users',
                icon: UserMultiple02Icon,
                text: 'Users',
                tabName: 'users',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/locations',
                icon: GlobalIcon,
                text: 'Locations',
                tabName: 'locations',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/nodes',
                icon: Activity02Icon,
                text: 'Nodes',
                tabName: 'nodes',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/servers',
                icon: ServerStack02Icon,
                text: 'Servers',
                tabName: 'servers',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/databases',
                icon: Database02Icon,
                text: 'Databases',
                tabName: 'databases',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/nests',
                icon: CubeIcon,
                text: 'Nests',
                tabName: 'nests',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/mounts',
                icon: FolderIcon,
                text: 'Mounts',
                tabName: 'mounts',
                ref: { current: null },
                end: false,
            },
        ],
        [],
    );

    return (
        <SidebarProvider>
            <HeaderProvider>
                <div className='flex flex-col w-full h-full relative'>
                    <AppHeader />

                    <div className='flex flex-col lg:flex-row h-full w-full overflow-hidden relative'>
                        <Sidebar navItems={navItems} className='hidden lg:flex' />
                        <MobileSidebar navItems={navItems} />

                        <PageContentBlock title={'Admin'}>
                            <Suspense
                                fallback={
                                    <div className='flex items-center justify-center h-full'>
                                        <Spinner />
                                    </div>
                                }
                            >
                                <Routes>
                                    <Route path='' element={<AdminDashboardContainer />} />
                                    <Route path='settings/*' element={<AdminSettingsContainer />} />
                                    <Route path='api/*' element={<AdminApiContainer />} />
                                    <Route path='servers/*' element={<AdminServersContainer />} />
                                    <Route path='nodes/*' element={<AdminNodesContainer />} />
                                    <Route path='users/*' element={<AdminUsersContainer />} />
                                    <Route path='locations/*' element={<AdminLocationsContainer />} />
                                    <Route path='databases/*' element={<AdminDatabasesContainer />} />
                                    <Route path='nests/*' element={<AdminNestsContainer />} />
                                    <Route path='mounts/*' element={<AdminMountsContainer />} />
                                    <Route path='buckets/*' element={<AdminBucketsContainer />} />
                                </Routes>
                            </Suspense>
                        </PageContentBlock>
                    </div>

                    <AdminBottomNav />
                </div>
            </HeaderProvider>
        </SidebarProvider>
    );
};

export default AdminRouter;
