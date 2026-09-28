import { useStoreState } from 'easy-peasy';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import getFilterOptions, { type FilterOptions } from '@/api/getFilterOptions';
import getServers from '@/api/getServers';

const EMPTY_FILTER_OPTIONS: FilterOptions = {
    owners: [],
    nests: [],
    eggs: [],
    nodes: [],
    groups: [],
    groupsEnabled: false,
};

import type { PaginatedResult } from '@/api/http';
import type { Server } from '@/api/server/getServer';
import GroupSection from '@/components/dashboard/GroupSection';
import ServerRow from '@/components/dashboard/ServerRow';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Pagination from '@/components/elements/Pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/elements/Tabs';
import { useHeader } from '@/contexts/HeaderContext';

import useFlash from '@/plugins/useFlash';
import { usePersistedState } from '@/plugins/usePersistedState';

import FilterDropdown from './header/FilterDropdown';
import FiltersMenu from './header/FiltersMenu';
import GroupDropdown from './header/GroupDropdown';
import OwnerFilterDropdown, { type OwnerFilterValue } from './header/OwnerFilterDropdown';
import SearchSection from './header/SearchSection';
import SortDropdown, { type SortPreset } from './header/SortDropdown';

const SORT_PRESETS: SortPreset[] = [
    { value: 'name', label: 'A → Z' },
    { value: '-name', label: 'Z → A' },
    { value: 'created_at', label: 'Oldest → Newest' },
    { value: '-created_at', label: 'Newest → Oldest' },
    { value: 'status', label: 'Status ▲' },
    { value: '-status', label: 'Status ▼' },
    { value: 'memory', label: 'Memory ↑' },
    { value: '-memory', label: 'Memory ↓' },
    { value: 'disk', label: 'Disk ↑' },
    { value: '-disk', label: 'Disk ↓' },
    { value: 'cpu', label: 'CPU ↑' },
    { value: '-cpu', label: 'CPU ↓' },
];

type FilterCategory = 'owner_id' | 'nest_id' | 'egg_id' | 'node_id';
type DashboardMode = 'list' | 'grid' | 'groups';

const DashboardContainer = () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!Number.isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data?.uuid);
    const rootAdmin = useStoreState((state) => state.user.data?.rootAdmin);
    const [ownerFilter, setOwnerFilter] = usePersistedState<OwnerFilterValue>(`${uuid}:server_view_mode`, 'owner');

    const { clearHeaderActions, setLeftActions, setCenterActions, setRightActions } = useHeader();

    const [dashboardMode, setDashboardMode] = usePersistedState<DashboardMode>(`${uuid}:dashboard_mode`, 'list');

    const [searchQuery, setSearchQuery] = useState('');
    const [sortValue, setSortValue] = useState('');
    const [filterField, setFilterField] = useState<FilterCategory | undefined>(undefined);
    const [filterValue, setFilterValue] = useState<number | undefined>(undefined);
    const [groupFilterId, setGroupFilterId] = useState<number | undefined>(undefined);

    const filterActive = searchQuery.trim() !== '' || filterField !== undefined || groupFilterId !== undefined;

    const { data: filterOptions } = useSWRImmutable('server:filter-options', () => getFilterOptions(), {
        revalidateOnMount: true,
    });

    const groupsEnabled = filterOptions?.groupsEnabled ?? true;

    useEffect(() => {
        if (!groupsEnabled && dashboardMode === 'groups') {
            setDashboardMode('list');
        }
    }, [groupsEnabled, dashboardMode, setDashboardMode]);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', ownerFilter, page, searchQuery, sortValue, filterField, filterValue, groupFilterId],
        () =>
            getServers({
                page,
                type: ownerFilter,
                query: searchQuery || undefined,
                sort: sortValue || undefined,
                filterField: filterField,
                filterValue: filterValue,
                groupId: groupFilterId,
            }),
        { revalidateOnFocus: false },
    );

    const handleSortChange = useCallback((value: string) => {
        setSortValue(value);
        setPage(1);
    }, []);

    const handleOwnerFilterChange = useCallback(
        (value: OwnerFilterValue) => {
            setOwnerFilter(value);
            setPage(1);
        },
        [setOwnerFilter],
    );

    const handleFilterChange = useCallback((field: FilterCategory | undefined, value: number | undefined) => {
        setFilterField(field);
        setFilterValue(value);
        setPage(1);
    }, []);

    const handleSearch = useCallback((value: string) => {
        setSearchQuery(value);
        setPage(1);
    }, []);

    const handleGroupChange = useCallback((groupId: number | undefined) => {
        setGroupFilterId(groupId);
        setPage(1);
    }, []);

    const searchSection = useMemo(
        () => <SearchSection className='max-w-360 hidden md:flex' onSearch={handleSearch} />,
        [handleSearch],
    );

    const viewTabs = useMemo(
        () => (
            <Tabs
                value={dashboardMode}
                onValueChange={(v) => setDashboardMode(v as DashboardMode)}
                className='md:block hidden'
            >
                <TabsList>
                    <TabsTrigger aria-label='View servers in a list layout.' value='list'>
                        <svg
                            width='13'
                            height='14'
                            viewBox='0 0 16 17'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                            role='img'
                            aria-label='List view'
                        >
                            <title>List view</title>
                            <path
                                d='M1 2.3C1 2.02 1 1.88 1.054 1.773C1.10215 1.67903 1.17881 1.60272 1.273 1.555C1.38 1.5 1.52 1.5 1.8 1.5H14.2C14.48 1.5 14.62 1.5 14.727 1.554C14.821 1.60215 14.8973 1.67881 14.945 1.773C15 1.88 15 2.02 15 2.3V2.7C15 2.98 15 3.12 14.945 3.227C14.8973 3.32119 14.821 3.39785 14.727 3.446C14.62 3.5 14.48 3.5 14.2 3.5H1.8C1.52 3.5 1.38 3.5 1.273 3.446C1.17903 3.39785 1.10272 3.32119 1.055 3.227C1 3.12 1 2.98 1 2.7V2.3ZM1 14.3C1 14.02 1 13.88 1.054 13.773C1.10215 13.679 1.17881 13.6027 1.273 13.555C1.38 13.5 1.52 13.5 1.8 13.5H14.2C14.48 13.5 14.62 13.5 14.727 13.555C14.8208 13.6029 14.8971 13.6792 14.945 13.773C15 13.88 15 14.02 15 14.3V14.7C15 14.98 15 15.12 14.945 15.227C14.8971 15.3208 14.8208 15.3971 14.727 15.445C14.62 15.5 14.48 15.5 14.2 15.5H1.8C1.52 15.5 1.38 15.5 1.273 15.445C1.17919 15.3971 1.10289 15.3208 1.055 15.227C1 15.12 1 14.98 1 14.7V14.3ZM1 10.3C1 10.02 1 9.88 1.054 9.773C1.10215 9.67903 1.17881 9.60272 1.273 9.555C1.38 9.5 1.52 9.5 1.8 9.5H14.2C14.48 9.5 14.62 9.5 14.727 9.555C14.8208 9.60289 14.8971 9.67918 14.945 9.773C15 9.88 15 10.02 15 10.3V10.7C15 10.98 15 11.12 14.945 11.227C14.8971 11.3208 14.8208 11.3971 14.727 11.445C14.62 11.5 14.48 11.5 14.2 11.5H1.8C1.52 11.5 1.38 11.5 1.273 11.445C1.17919 11.3971 1.10289 11.3208 1.055 11.227C1 11.12 1 10.98 1 10.7V10.3ZM1 6.3C1 6.02 1 5.88 1.054 5.773C1.10215 5.67903 1.17881 5.60272 1.273 5.555C1.38 5.5 1.52 5.5 1.8 5.5H14.2C14.48 5.5 14.62 5.5 14.727 5.554C14.821 5.60215 14.8973 5.67881 14.945 5.773C15 5.88 15 6.02 15 6.3V6.7C15 6.98 15 7.12 14.945 7.227C14.8971 7.32082 14.8208 7.39711 14.727 7.445C14.62 7.5 14.48 7.5 14.2 7.5H1.8C1.52 7.5 1.38 7.5 1.273 7.446C1.17903 7.39785 1.10272 7.32119 1.055 7.227C1 7.12 1 6.98 1 6.7V6.3Z'
                                fill='currentColor'
                            />
                        </svg>
                    </TabsTrigger>
                    <TabsTrigger aria-label='View servers in a grid layout.' value='grid'>
                        <svg
                            width='13'
                            height='14'
                            viewBox='0 0 16 17'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                            role='img'
                            aria-label='Grid view'
                        >
                            <title>Grid view</title>
                            <path
                                d='M1 3.1C1 2.54 1 2.26 1.109 2.046C1.20487 1.85785 1.35785 1.70487 1.546 1.609C1.76 1.5 2.04 1.5 2.6 1.5H5.4C5.96 1.5 6.24 1.5 6.454 1.609C6.64215 1.70487 6.79513 1.85785 6.891 2.046C7 2.26 7 2.54 7 3.1V3.9C7 4.46 7 4.74 6.891 4.954C6.79513 5.14215 6.64215 5.29513 6.454 5.391C6.24 5.5 5.96 5.5 5.4 5.5H2.6C2.04 5.5 1.76 5.5 1.546 5.391C1.35785 5.29513 1.20487 5.14215 1.109 4.954C1 4.74 1 4.46 1 3.9V3.1ZM9 3.1C9 2.54 9 2.26 9.109 2.046C9.20487 1.85785 9.35785 1.70487 9.546 1.609C9.76 1.5 10.04 1.5 10.6 1.5H13.4C13.96 1.5 14.24 1.5 14.454 1.609C14.6422 1.70487 14.7951 1.85785 14.891 2.046C15 2.26 15 2.54 15 3.1V3.9C15 4.46 15 4.74 14.891 4.954C14.7951 5.14215 14.6422 5.29513 14.454 5.391C14.24 5.5 13.96 5.5 13.4 5.5H10.6C10.04 5.5 9.76 5.5 9.546 5.391C9.35785 5.29513 9.20487 5.14215 9.109 4.954C9 4.74 9 4.46 9 3.9V3.1ZM1 8.1C1 7.54 1 7.26 1.109 7.046C1.20487 6.85785 1.35785 6.70487 1.546 6.609C1.76 6.5 2.04 6.5 2.6 6.5H5.4C5.96 6.5 6.24 6.5 6.454 6.609C6.64215 6.70487 6.79513 6.85785 6.891 7.046C7 7.26 7 7.54 7 8.1V8.9C7 9.46 7 9.74 6.891 9.954C6.79513 10.1422 6.64215 10.2951 6.454 10.391C6.24 10.5 5.96 10.5 5.4 10.5H2.6C2.04 10.5 1.76 10.5 1.546 10.391C1.35785 10.2951 1.20487 10.1422 1.109 9.954C1 9.74 1 9.46 1 8.9V8.1ZM9 8.1C9 7.54 9 7.26 9.109 7.046C9.20487 6.85785 9.35785 6.70487 9.546 6.609C9.76 6.5 10.04 6.5 10.6 6.5H13.4C13.96 6.5 14.24 6.5 14.454 6.609C14.6422 6.70487 14.7951 6.85785 14.891 7.046C15 7.26 15 7.54 15 8.1V8.9C15 9.46 15 9.74 14.891 9.954C14.7951 10.1422 14.6422 10.2951 14.454 10.391C14.24 10.5 13.96 10.5 13.4 10.5H10.6C10.04 10.5 9.76 10.5 9.546 10.391C9.35785 10.2951 9.20487 10.1422 9.109 9.954C9 9.74 9 9.46 9 8.9V8.1ZM1 13.1C1 12.54 1 12.26 1.109 12.046C1.20487 11.8578 1.35785 11.7049 1.546 11.609C1.76 11.5 2.04 11.5 2.6 11.5H5.4C5.96 11.5 6.24 11.5 6.454 11.609C6.64215 11.7049 6.79513 11.8578 6.891 12.046C7 12.26 7 12.54 7 13.1V13.9C7 14.46 7 14.74 6.891 14.954C6.79513 15.1422 6.64215 15.2951 6.454 15.391C6.24 15.5 5.96 15.5 5.4 15.5H2.6C2.04 15.5 1.76 15.5 1.546 15.391C1.35785 15.2951 1.20487 15.1422 1.109 14.954C1 14.74 1 14.46 1 13.9V13.1ZM9 13.1C9 12.54 9 12.26 9.109 12.046C9.20487 11.8578 9.35785 11.7049 9.546 11.609C9.76 11.5 10.04 11.5 10.6 11.5H13.4C13.96 11.5 14.24 11.5 14.454 11.609C14.6422 11.7049 14.7951 11.8578 14.891 12.046C15 12.26 15 12.54 15 13.1V13.9C15 14.46 15 14.74 14.891 14.954C14.7951 15.1422 14.6422 15.2951 14.454 15.391C14.24 15.5 13.96 15.5 13.4 15.5H10.6C10.04 15.5 9.76 15.5 9.546 15.391C9.35785 15.2951 9.20487 15.1422 9.109 14.954C9 14.74 9 14.46 9 13.9V13.1Z'
                                fill='currentColor'
                            />
                        </svg>
                    </TabsTrigger>
                    {groupsEnabled && (
                        <TabsTrigger aria-label='View servers grouped.' value='groups'>
                            <svg
                                width='13'
                                height='14'
                                viewBox='0 0 16 17'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                                role='img'
                                aria-label='Group view'
                            >
                                <title>Group view</title>
                                <path
                                    d='M1.5 2.5C1.5 2.086 1.5 1.879 1.581 1.715C1.652 1.57 1.77 1.452 1.915 1.381C2.079 1.3 2.286 1.3 2.7 1.3H6.3C6.714 1.3 6.921 1.3 7.085 1.381C7.23 1.452 7.348 1.57 7.419 1.715C7.5 1.879 7.5 2.086 7.5 2.5V3.1C7.5 3.514 7.5 3.721 7.419 3.885C7.348 4.03 7.23 4.148 7.085 4.219C6.921 4.3 6.714 4.3 6.3 4.3H2.7C2.286 4.3 2.079 4.3 1.915 4.219C1.77 4.148 1.652 4.03 1.581 3.885C1.5 3.721 1.5 3.514 1.5 3.1V2.5Z'
                                    fill='currentColor'
                                />
                                <path
                                    d='M8.5 2.5C8.5 2.086 8.5 1.879 8.581 1.715C8.652 1.57 8.77 1.452 8.915 1.381C9.079 1.3 9.286 1.3 9.7 1.3H13.3C13.714 1.3 13.921 1.3 14.085 1.381C14.23 1.452 14.348 1.57 14.419 1.715C14.5 1.879 14.5 2.086 14.5 2.5V3.1C14.5 3.514 14.5 3.721 14.419 3.885C14.348 4.03 14.23 4.148 14.085 4.219C13.921 4.3 13.714 4.3 13.3 4.3H9.7C9.286 4.3 9.079 4.3 8.915 4.219C8.77 4.148 8.652 4.03 8.581 3.885C8.5 3.721 8.5 3.514 8.5 3.1V2.5Z'
                                    fill='currentColor'
                                />
                                <path
                                    d='M1.5 7.7C1.5 7.286 1.5 7.079 1.581 6.915C1.652 6.77 1.77 6.652 1.915 6.581C2.079 6.5 2.286 6.5 2.7 6.5H6.3C6.714 6.5 6.921 6.5 7.085 6.581C7.23 6.652 7.348 6.77 7.419 6.915C7.5 7.079 7.5 7.286 7.5 7.7V8.3C7.5 8.714 7.5 8.921 7.419 9.085C7.348 9.23 7.23 9.348 7.085 9.419C6.921 9.5 6.714 9.5 6.3 9.5H2.7C2.286 9.5 2.079 9.5 1.915 9.419C1.77 9.348 1.652 9.23 1.581 9.085C1.5 8.921 1.5 8.714 1.5 8.3V7.7Z'
                                    fill='currentColor'
                                />
                                <path
                                    d='M8.5 7.7C8.5 7.286 8.5 7.079 8.581 6.915C8.652 6.77 8.77 6.652 8.915 6.581C9.079 6.5 9.286 6.5 9.7 6.5H13.3C13.714 6.5 13.921 6.5 14.085 6.581C14.23 6.652 14.348 6.77 14.419 6.915C14.5 7.079 14.5 7.286 14.5 7.7V8.3C14.5 8.714 14.5 8.921 14.419 9.085C14.348 9.23 14.23 9.348 14.085 9.419C13.921 9.5 13.714 9.5 13.3 9.5H9.7C9.286 9.5 9.079 9.5 8.915 9.419C8.77 9.348 8.652 9.23 8.581 9.085C8.5 8.921 8.5 8.714 8.5 8.3V7.7Z'
                                    fill='currentColor'
                                />
                                <path
                                    d='M1.5 12.9C1.5 12.486 1.5 12.279 1.581 12.115C1.652 11.97 1.77 11.852 1.915 11.781C2.079 11.7 2.286 11.7 2.7 11.7H6.3C6.714 11.7 6.921 11.7 7.085 11.781C7.23 11.852 7.348 11.97 7.419 12.115C7.5 12.279 7.5 12.486 7.5 12.9V13.5C7.5 13.914 7.5 14.121 7.419 14.285C7.348 14.43 7.23 14.548 7.085 14.619C6.921 14.7 6.714 14.7 6.3 14.7H2.7C2.286 14.7 2.079 14.7 1.915 14.619C1.77 14.548 1.652 14.43 1.581 14.285C1.5 14.121 1.5 13.914 1.5 13.5V12.9Z'
                                    fill='currentColor'
                                />
                                <path
                                    d='M8.5 12.9C8.5 12.486 8.5 12.279 8.581 12.115C8.652 11.97 8.77 11.852 8.915 11.781C9.079 11.7 9.286 11.7 9.7 11.7H13.3C13.714 11.7 13.921 11.7 14.085 11.781C14.23 11.852 14.348 11.97 14.419 12.115C14.5 12.279 14.5 12.486 14.5 12.9V13.5C14.5 13.914 14.5 14.121 14.419 14.285C14.348 14.43 14.23 14.548 14.085 14.619C13.921 14.7 13.714 14.7 13.3 14.7H9.7C9.286 14.7 9.079 14.7 8.915 14.619C8.77 14.548 8.652 14.43 8.581 14.285C8.5 14.121 8.5 13.914 8.5 13.5V12.9Z'
                                    fill='currentColor'
                                />
                            </svg>
                        </TabsTrigger>
                    )}
                </TabsList>
            </Tabs>
        ),
        [dashboardMode, setDashboardMode, groupsEnabled],
    );

    const ownerFilterDropdown = useMemo(
        () => (
            <OwnerFilterDropdown
                value={ownerFilter ?? 'owner'}
                rootAdmin={rootAdmin ?? false}
                onChange={handleOwnerFilterChange}
            />
        ),
        [ownerFilter, rootAdmin, handleOwnerFilterChange],
    );

    const entityFilterDropdown = useMemo(
        () => (
            <FilterDropdown
                filterOptions={filterOptions || { owners: [], nests: [], eggs: [], nodes: [], groups: [] }}
                activeField={filterField}
                activeValue={filterValue}
                onFilterChange={handleFilterChange}
            />
        ),
        [filterOptions, filterField, filterValue, handleFilterChange],
    );

    const groupDropdown = useMemo(
        () => (
            <GroupDropdown
                groups={filterOptions?.groups || []}
                activeGroupId={groupFilterId}
                onGroupChange={handleGroupChange}
            />
        ),
        [filterOptions, groupFilterId, handleGroupChange],
    );

    const sortDropdown = useMemo(
        () => <SortDropdown presets={SORT_PRESETS} value={sortValue} onSortChange={handleSortChange} />,
        [sortValue, handleSortChange],
    );

    const filterControlsDesktop = useMemo(
        () => (
            <div className='hidden lg:flex items-center gap-1.5 sm:gap-2'>
                {groupsEnabled
                    ? [entityFilterDropdown, groupDropdown, sortDropdown]
                    : [entityFilterDropdown, sortDropdown]}
            </div>
        ),
        [groupsEnabled, entityFilterDropdown, groupDropdown, sortDropdown],
    );

    const filterControlsMobile = useMemo(
        () => (
            <div className='lg:hidden'>
                <FiltersMenu
                    filterOptions={filterOptions || EMPTY_FILTER_OPTIONS}
                    groups={filterOptions?.groups || []}
                    activeField={filterField}
                    activeValue={filterValue}
                    activeGroupId={groupFilterId}
                    sortValue={sortValue}
                    sortPresets={SORT_PRESETS}
                    showGroups={groupsEnabled}
                    onFilterChange={handleFilterChange}
                    onGroupChange={handleGroupChange}
                    onSortChange={handleSortChange}
                />
            </div>
        ),
        [
            filterOptions,
            filterField,
            filterValue,
            groupFilterId,
            sortValue,
            groupsEnabled,
            handleFilterChange,
            handleGroupChange,
            handleSortChange,
        ],
    );

    useEffect(() => {
        setLeftActions([viewTabs, ownerFilterDropdown]);
        setCenterActions(searchSection);
        setRightActions([filterControlsDesktop, filterControlsMobile]);
        return () => clearHeaderActions();
    }, [
        setLeftActions,
        setCenterActions,
        setRightActions,
        clearHeaderActions,
        searchSection,
        viewTabs,
        ownerFilterDropdown,
        filterControlsDesktop,
        filterControlsMobile,
    ]);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers]);

    useEffect(() => {
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error, clearAndAddHttpError, clearFlashes]);

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            {!servers ? null : (
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) =>
                        dashboardMode === 'groups' ? (
                            <GroupSection
                                servers={items}
                                displayOption={dashboardMode === 'grid' ? 'grid' : 'list'}
                                groupFilterId={groupFilterId}
                                filterActive={filterActive}
                            />
                        ) : items.length > 0 ? (
                            <div
                                className={
                                    dashboardMode === 'grid' ? 'flex flex-wrap gap-4 max-lg:flex-col max-lg:gap-0' : ''
                                }
                            >
                                {items.map((server, index) => (
                                    <div
                                        key={`${server.uuid}-${dashboardMode}`}
                                        className={`transform-gpu skeleton-anim-2 ${
                                            dashboardMode === 'grid'
                                                ? items.length === 1
                                                    ? 'w-[calc(50%-0.5rem)] max-lg:w-full'
                                                    : 'w-[calc(50%-0.5rem)] max-lg:w-full'
                                                : 'mb-4'
                                        } max-lg:mb-4`}
                                        style={{
                                            animationDelay: `${index * 50 + 50}ms`,
                                            animationTimingFunction:
                                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                        }}
                                    >
                                        <ServerRow
                                            className={
                                                dashboardMode === 'list'
                                                    ? 'flex-row'
                                                    : 'items-start! flex-col w-full gap-4 [&>div~div]:w-full max-lg:flex-row max-lg:items-center max-lg:gap-0 max-lg:[&>div~div]:w-auto'
                                            }
                                            key={server.uuid}
                                            server={server}
                                            hideGroup={!groupsEnabled}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='text-center text-sm text-zinc-400 absolute w-full left-1/2 -translate-x-1/2'>
                                <p className='max-w-sm mx-auto mb-5'>
                                    {ownerFilter === 'admin-all'
                                        ? 'There are no other servers to display.'
                                        : ownerFilter === 'all'
                                          ? 'No Server Shared With your Account'
                                          : 'There are no servers associated with your account.'}
                                </p>
                                <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                                    {ownerFilter === 'admin-all' ? 'No other servers found' : 'No servers found'}
                                </h3>
                            </div>
                        )
                    }
                </Pagination>
            )}
        </PageContentBlock>
    );
};

export default DashboardContainer;
