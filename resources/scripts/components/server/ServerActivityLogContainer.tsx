import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import type { ActivityLogFilters } from '@/api/account/activity';
import { useActivityLogs } from '@/api/server/activity';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import FlashMessageRender from '@/components/FlashMessageRender';
import ServerHeader from '@/components/server/header/ServerHeader';
import { Button } from '@/components/ui/button';

import { useFlashKey } from '@/plugins/useFlash';
import useLocationHash from '@/plugins/useLocationHash';

const ServerActivityLogContainer = () => {
    const { hash } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('server:activity');
    const [filters, setFilters] = useState<ActivityLogFilters>({
        page: 1,
        sorts: { timestamp: -1 },
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
    const [selectedEventType, setSelectedEventType] = useState('');
    const [dateRange, setDateRange] = useState('all');

    const { data, isValidating, error } = useActivityLogs(filters, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    // Extract unique event types for filter dropdown
    const eventTypes = useMemo(() => {
        if (!data?.items) return [];
        const types = [...new Set(data.items.map((item) => item.event))];
        return types.sort();
    }, [data?.items]);

    // Filter data based on search term and event type
    const filteredData = useMemo(() => {
        if (!data?.items) return data;

        let filtered = data.items;

        if (debouncedSearchTerm) {
            filtered = filtered.filter(
                (item) =>
                    item.event.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    item.ip?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    item.relationships.actor?.username?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    JSON.stringify(item.properties).toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
            );
        }

        if (selectedEventType) {
            filtered = filtered.filter((item) => item.event === selectedEventType);
        }

        // Apply date range filtering
        if (dateRange !== 'all') {
            const now = new Date();
            const cutoff = new Date();

            switch (dateRange) {
                case '1h':
                    cutoff.setHours(now.getHours() - 1);
                    break;
                case '24h':
                    cutoff.setDate(now.getDate() - 1);
                    break;
                case '7d':
                    cutoff.setDate(now.getDate() - 7);
                    break;
                case '30d':
                    cutoff.setDate(now.getDate() - 30);
                    break;
            }

            filtered = filtered.filter((item) => new Date(item.timestamp) >= cutoff);
        }

        return { ...data, items: filtered };
    }, [data, debouncedSearchTerm, selectedEventType, dateRange]);

    const exportLogs = useCallback(() => {
        if (!filteredData?.items) return;

        const csvContent = [
            ['Timestamp', 'Event', 'Actor', 'IP Address', 'Properties'].join(','),
            ...filteredData.items.map((item) =>
                [
                    new Date(item.timestamp).toISOString(),
                    item.event,
                    item.relationships.actor?.username || 'System',
                    item.ip || '',
                    JSON.stringify(item.properties).replace(/"/g, '""'),
                ]
                    .map((field) => `"${field}"`)
                    .join(','),
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `server-activity-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }, [filteredData]);

    const clearAllFilters = () => {
        setFilters((value) => ({ ...value, filters: {} }));
        setSearchTerm('');
        setSelectedEventType('');
        setDateRange('all');
    };

    const hasActiveFilters =
        filters.filters?.event || filters.filters?.ip || searchTerm || selectedEventType || dateRange !== 'all';

    useEffect(() => {
        setFilters((value) => ({
            ...value,
            filters: { ip: hash.ip, event: hash.event },
        }));
    }, [hash]);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error, clearAndAddHttpError]);

    return (
        <ServerContentBlock title={'Activity Log'} showFlashKey={'activity'} className='p-0!'>
            <ServerHeader />

            <div className='flex flex-col gap-6 px-4 py-8 sm:px-14 sm:py-14'>
                <FlashMessageRender byKey={'server:activity'} />

                <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                    <Input.Text
                        id='server-activity-search'
                        type='text'
                        placeholder='Search events, IPs, users...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='sm:max-w-xs'
                    />
                    <Dropdown
                        id='server-activity-event-type'
                        value={selectedEventType}
                        onChange={setSelectedEventType}
                        placeholder='All events'
                        triggerClassName='w-auto'
                        options={[
                            { value: '', label: 'All events' },
                            ...eventTypes.map((type) => ({ value: type, label: type })),
                        ]}
                    />
                    <Dropdown
                        id='server-activity-time-range'
                        value={dateRange}
                        onChange={setDateRange}
                        triggerClassName='w-auto'
                        options={[
                            { value: 'all', label: 'All time' },
                            { value: '1h', label: 'Last hour' },
                            { value: '24h', label: 'Last 24 hours' },
                            { value: '7d', label: 'Last 7 days' },
                            { value: '30d', label: 'Last 30 days' },
                        ]}
                    />
                    <div className='flex items-center gap-2 sm:ml-auto'>
                        {hasActiveFilters && (
                            <Button variant='ghost' onClick={clearAllFilters}>
                                Clear
                            </Button>
                        )}
                        <Button variant='secondary' onClick={exportLogs} disabled={!filteredData?.items?.length}>
                            Export
                        </Button>
                    </div>
                </div>

                {!data && isValidating ? (
                    <div className='flex items-center justify-center py-24'>
                        <div className='flex flex-col items-center gap-3'>
                            <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-brand' />
                            <p className='text-sm text-neutral-400'>Loading activity...</p>
                        </div>
                    </div>
                ) : !filteredData?.items?.length ? (
                    <div className='py-16'>
                        <h3 className='text-sm font-medium text-zinc-100'>
                            {hasActiveFilters ? 'No matching activity' : 'No activity yet'}
                        </h3>
                        <p className='mt-1 max-w-md text-sm text-zinc-400'>
                            {hasActiveFilters
                                ? 'Nothing on this page matches those filters.'
                                : 'Events show up here as the server is used.'}
                        </p>
                        {hasActiveFilters && (
                            <Button variant='secondary' className='mt-4' onClick={clearAllFilters}>
                                Clear filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className='flex flex-col'>
                        <p className='mb-2 text-xs text-zinc-500'>
                            {filteredData.items.length} {filteredData.items.length === 1 ? 'event' : 'events'}
                        </p>
                        <div className='divide-y divide-[#ffffff10]'>
                            {filteredData.items.map((activity) => (
                                <ActivityLogEntry key={activity.id} activity={activity} />
                            ))}
                        </div>
                    </div>
                )}

                {data && (
                    <PaginationFooter
                        pagination={data.pagination}
                        onPageSelect={(page) => setFilters((value) => ({ ...value, page }))}
                    />
                )}
            </div>
        </ServerContentBlock>
    );
};

export default ServerActivityLogContainer;
