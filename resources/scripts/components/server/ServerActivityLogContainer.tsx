import { ArrowDownToLine, ArrowRotateLeft, Magnifier, Xmark } from '@gravity-ui/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import type { ActivityLogFilters } from '@/api/account/activity';
import { fetchAllActivityLogs, useActivityEvents, useActivityLogs } from '@/api/server/activity';
import { getGlobalDaemonType } from '@/api/server/getServer';
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
import { ServerContext } from '@/state/server';

const DATE_RANGE_OPTIONS = [
    { value: 'all', label: 'All time' },
    { value: '1h', label: 'Last hour' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
] as const;

const computeAfter = (range: string): string | undefined => {
    if (range === 'all') return undefined;

    const cutoff = new Date();
    switch (range) {
        case '1h':
            cutoff.setHours(cutoff.getHours() - 1);
            break;
        case '24h':
            cutoff.setDate(cutoff.getDate() - 1);
            break;
        case '7d':
            cutoff.setDate(cutoff.getDate() - 7);
            break;
        case '30d':
            cutoff.setDate(cutoff.getDate() - 30);
            break;
    }

    return cutoff.toISOString();
};

const ServerActivityLogContainer = () => {
    const { hash, pathTo } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('server:activity');

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
    const [selectedEventType, setSelectedEventType] = useState('');
    const [dateRange, setDateRange] = useState('all');
    const [exporting, setExporting] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const daemonType = getGlobalDaemonType();

    const filters = useMemo<ActivityLogFilters>(() => {
        const filter: NonNullable<ActivityLogFilters['filters']> = {};
        if (debouncedSearchTerm) filter.search = debouncedSearchTerm;
        if (selectedEventType) filter.event = selectedEventType;
        if (hash.ip) filter.ip = hash.ip;

        const after = computeAfter(dateRange);
        if (after) filter.after = after;

        return { page, sorts: { timestamp: -1 }, filters: filter };
    }, [page, debouncedSearchTerm, selectedEventType, dateRange, hash.ip]);

    const { data, isValidating, error, mutate } = useActivityLogs(filters, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    const { data: eventTypes } = useActivityEvents({ revalidateOnFocus: false });

    const selectEventType = useCallback(
        (value: string) => {
            setSelectedEventType(value);
            setPage(1);
            window.location.hash = pathTo({ event: value });
        },
        [pathTo],
    );

    useEffect(() => {
        setSelectedEventType(hash.event || '');
    }, [hash.event]);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error, clearAndAddHttpError]);

    const hasActiveFilters =
        Boolean(debouncedSearchTerm) || Boolean(selectedEventType) || Boolean(hash.ip) || dateRange !== 'all';

    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedEventType('');
        setDateRange('all');
        setPage(1);
        window.location.hash = pathTo({ event: '', ip: '' });
    };

    // Exports every event matching the current filters, not just the page that is
    // currently visible on screen.
    const exportLogs = useCallback(async () => {
        if (exporting || !uuid || !daemonType || !data?.pagination.total) return;

        setExporting(true);
        try {
            const items = await fetchAllActivityLogs(uuid, daemonType, filters);
            if (items.length === 0) return;

            const csvContent = [
                ['Timestamp', 'Event', 'Actor', 'IP Address', 'Properties'].join(','),
                ...items.map((item) =>
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
        } finally {
            setExporting(false);
        }
    }, [data, exporting, filters, uuid, daemonType]);

    const eventOptions = useMemo(() => {
        const events = eventTypes ?? [];
        const all = selectedEventType && !events.includes(selectedEventType) ? [selectedEventType, ...events] : events;

        return [{ value: '', label: 'All events' }, ...all.map((event) => ({ value: event, label: event }))];
    }, [eventTypes, selectedEventType]);

    const total = data?.pagination.total ?? 0;

    return (
        <ServerContentBlock title={'Activity Log'} showFlashKey={'activity'} className='p-0!'>
            <ServerHeader />

            <div className='flex flex-col gap-6 px-4 py-8 sm:px-14 sm:py-14'>
                <FlashMessageRender byKey={'server:activity'} />

                <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                    <div className='relative w-full sm:max-w-xs sm:flex-1'>
                        <Magnifier
                            width={18}
                            height={18}
                            className='pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-zinc-400'
                            fill='currentColor'
                        />
                        <Input.Text
                            id='server-activity-search'
                            type='text'
                            placeholder='Search events, IPs, users...'
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            style={{ paddingLeft: '2.5rem', paddingRight: searchTerm ? '2.5rem' : undefined }}
                        />
                        {searchTerm && (
                            <button
                                type='button'
                                onClick={() => setSearchTerm('')}
                                className='absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-zinc-100'
                                aria-label='Clear search'
                            >
                                <Xmark width={16} height={16} fill='currentColor' />
                            </button>
                        )}
                    </div>
                    <Dropdown
                        id='server-activity-event-type'
                        value={selectedEventType}
                        onChange={selectEventType}
                        placeholder='All events'
                        searchable
                        searchPlaceholder='Filter events…'
                        triggerClassName='w-auto sm:w-52'
                        options={eventOptions}
                    />
                    <Dropdown
                        id='server-activity-time-range'
                        value={dateRange}
                        onChange={(value) => {
                            setDateRange(value);
                            setPage(1);
                        }}
                        triggerClassName='w-auto sm:w-44'
                        options={[...DATE_RANGE_OPTIONS]}
                    />
                    <div className='flex items-center gap-2 sm:ml-auto'>
                        {hasActiveFilters && (
                            <Button variant='ghost' onClick={clearAllFilters}>
                                Clear
                            </Button>
                        )}
                        <Button
                            variant='secondary'
                            onClick={() => mutate()}
                            disabled={isValidating && !data}
                            className='flex items-center gap-2'
                        >
                            <ArrowRotateLeft
                                width={18}
                                height={18}
                                className={isValidating ? 'animate-spin' : ''}
                                fill='currentColor'
                            />
                            Refresh
                        </Button>
                        <Button
                            variant='secondary'
                            onClick={exportLogs}
                            disabled={exporting || !data?.pagination.total}
                            className='flex items-center gap-2'
                        >
                            {exporting ? (
                                <ArrowRotateLeft width={18} height={18} className='animate-spin' fill='currentColor' />
                            ) : (
                                <ArrowDownToLine width={18} height={18} fill='currentColor' />
                            )}
                            {exporting ? 'Exporting…' : 'Export'}
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
                ) : !data?.items?.length ? (
                    <div className='py-16'>
                        <h3 className='text-sm font-medium text-zinc-100'>
                            {hasActiveFilters ? 'No matching activity' : 'No activity yet'}
                        </h3>
                        <p className='mt-1 max-w-md text-sm text-zinc-400'>
                            {hasActiveFilters
                                ? 'Nothing matches those search terms or filters.'
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
                            {total} {total === 1 ? 'event' : 'events'}
                        </p>
                        <div className='divide-y divide-[#ffffff10]'>
                            {data.items.map((activity) => (
                                <ActivityLogEntry key={activity.id} activity={activity} />
                            ))}
                        </div>
                        {data.pagination.totalPages > 1 && (
                            <div className='mt-4'>
                                <PaginationFooter pagination={data.pagination} onPageSelect={setPage} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ServerContentBlock>
    );
};

export default ServerActivityLogContainer;
