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
import { useTranslation } from '@/i18n/I18nProvider';
import { useFlashKey } from '@/plugins/useFlash';
import useLocationHash from '@/plugins/useLocationHash';
import { ServerContext } from '@/state/server';

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
    const { t } = useTranslation();
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

    const dateRangeOptions = useMemo(
        () => [
            { value: 'all', label: t('server.activity.all_time') },
            { value: '1h', label: t('server.activity.last_hour') },
            { value: '24h', label: t('server.activity.last_24_hours') },
            { value: '7d', label: t('server.activity.last_7_days') },
            { value: '30d', label: t('server.activity.last_30_days') },
        ],
        [t],
    );

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
                [
                    t('server.activity.csv_timestamp'),
                    t('server.activity.csv_event'),
                    t('server.activity.csv_actor'),
                    t('server.activity.csv_ip_address'),
                    t('server.activity.csv_properties'),
                ].join(','),
                ...items.map((item) =>
                    [
                        new Date(item.timestamp).toISOString(),
                        item.event,
                        item.relationships.actor?.username || t('server.activity.system'),
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
    }, [data, exporting, filters, uuid, daemonType, t]);

    const eventOptions = useMemo(() => {
        const events = eventTypes ?? [];
        const all = selectedEventType && !events.includes(selectedEventType) ? [selectedEventType, ...events] : events;

        return [
            { value: '', label: t('server.activity.all_events') },
            ...all.map((event) => ({ value: event, label: event })),
        ];
    }, [eventTypes, selectedEventType, t]);

    const total = data?.pagination.total ?? 0;

    return (
        <ServerContentBlock title={t('server.activity.title')} showFlashKey={'activity'} className='p-0!'>
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
                            placeholder={t('server.activity.search_placeholder')}
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
                                aria-label={t('server.activity.clear_search')}
                            >
                                <Xmark width={16} height={16} fill='currentColor' />
                            </button>
                        )}
                    </div>
                    <Dropdown
                        id='server-activity-event-type'
                        value={selectedEventType}
                        onChange={selectEventType}
                        placeholder={t('server.activity.all_events')}
                        searchable
                        searchPlaceholder={t('server.activity.filter_events')}
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
                        options={dateRangeOptions}
                    />
                    <div className='flex items-center gap-2 sm:ml-auto'>
                        {hasActiveFilters && (
                            <Button variant='ghost' onClick={clearAllFilters}>
                                {t('server.activity.clear')}
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
                            {t('common.refresh')}
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
                            {exporting ? t('server.activity.exporting') : t('server.activity.export')}
                        </Button>
                    </div>
                </div>

                {!data && isValidating ? (
                    <div className='flex items-center justify-center py-24'>
                        <div className='flex flex-col items-center gap-3'>
                            <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-brand' />
                            <p className='text-sm text-neutral-400'>{t('server.activity.loading')}</p>
                        </div>
                    </div>
                ) : !data?.items?.length ? (
                    <div className='py-16'>
                        <h3 className='text-sm font-medium text-zinc-100'>
                            {hasActiveFilters
                                ? t('server.activity.empty_filtered_title')
                                : t('server.activity.empty_title')}
                        </h3>
                        <p className='mt-1 max-w-md text-sm text-zinc-400'>
                            {hasActiveFilters
                                ? t('server.activity.empty_filtered_description')
                                : t('server.activity.empty_description')}
                        </p>
                        {hasActiveFilters && (
                            <Button variant='secondary' className='mt-4' onClick={clearAllFilters}>
                                {t('server.activity.clear_filters')}
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className='flex flex-col'>
                        <p className='mb-2 text-xs text-zinc-500'>
                            {t(
                                total === 1 ? 'server.activity.events_count_one' : 'server.activity.events_count_other',
                                { count: total },
                            )}
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
