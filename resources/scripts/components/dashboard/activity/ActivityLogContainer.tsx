import { ArrowDownToLine, ArrowRotateLeft, Magnifier, Xmark } from '@gravity-ui/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import {
    type ActivityLogFilters,
    fetchAllActivityLogs,
    useActivityEvents,
    useActivityLogs,
} from '@/api/account/activity';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { activityEventLabel } from '@/lib/activityEvents';

import { useFlashKey } from '@/plugins/useFlash';
import useLocationHash from '@/plugins/useLocationHash';

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

const ActivityLogContainer = () => {
    const { t } = useTranslation();
    const { hash, pathTo } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('account');

    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
    const [selectedEventType, setSelectedEventType] = useState('');
    const [dateRange, setDateRange] = useState('all');
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [exporting, setExporting] = useState(false);

    const dateRangeOptions = useMemo(
        () => [
            { value: 'all', label: t('account.activity.all_time') },
            { value: '1h', label: t('account.activity.last_hour') },
            { value: '24h', label: t('account.activity.last_24_hours') },
            { value: '7d', label: t('account.activity.last_7_days') },
            { value: '30d', label: t('account.activity.last_30_days') },
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
        refreshInterval: autoRefresh ? 30000 : 0, // Auto-refresh every 30 seconds.
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

    const exportLogs = useCallback(async () => {
        if (exporting || !data?.pagination.total) return;

        setExporting(true);
        try {
            const items = await fetchAllActivityLogs(filters);
            if (items.length === 0) return;

            const csvContent = [
                [
                    t('account.activity.csv_timestamp'),
                    t('account.activity.csv_event'),
                    t('account.activity.csv_actor'),
                    t('account.activity.csv_ip_address'),
                    t('account.activity.csv_properties'),
                ].join(','),
                ...items.map((item) =>
                    [
                        new Date(item.timestamp).toISOString(),
                        item.event,
                        item.relationships.actor?.username || t('account.activity.system'),
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
            a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    }, [data, exporting, filters, t]);

    const eventOptions = useMemo(() => {
        const events = eventTypes ?? [];
        const all = selectedEventType && !events.includes(selectedEventType) ? [selectedEventType, ...events] : events;

        return [
            { value: '', label: t('account.activity.all_events') },
            ...all.map((event) => ({ value: event, label: activityEventLabel(t, event) })),
        ];
    }, [eventTypes, selectedEventType, t]);

    const total = data?.pagination.total ?? 0;

    return (
        <PageContentBlock title={t('account.activity.title')}>
            <div className='w-full h-full min-h-full flex-1 flex flex-col px-2 sm:px-0'>
                <FlashMessageRender byKey={'account'} />

                <div className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'>
                    <MainPageHeader title={t('account.activity.heading')}>
                        <div className='flex flex-wrap items-center gap-2'>
                            <Button
                                variant='secondary'
                                onClick={() => mutate()}
                                disabled={isValidating && !data}
                                className='flex items-center gap-2'
                            >
                                <ArrowRotateLeft
                                    width={22}
                                    height={22}
                                    className={isValidating ? 'animate-spin' : ''}
                                    fill='currentColor'
                                />
                                {t('common.refresh')}
                            </Button>
                            <Button
                                variant={autoRefresh ? 'default' : 'secondary'}
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className='flex items-center gap-2'
                            >
                                <span
                                    className={[
                                        'h-2 w-2 rounded-full',
                                        autoRefresh ? 'animate-pulse bg-emerald-400' : 'bg-transparent',
                                    ].join(' ')}
                                />
                                {autoRefresh ? t('account.activity.live') : t('account.activity.go_live')}
                            </Button>
                            <Button
                                variant='secondary'
                                onClick={exportLogs}
                                disabled={exporting || !data?.pagination.total}
                                className='flex items-center gap-2'
                            >
                                {exporting ? (
                                    <ArrowRotateLeft
                                        width={22}
                                        height={22}
                                        className='animate-spin'
                                        fill='currentColor'
                                    />
                                ) : (
                                    <ArrowDownToLine width={22} height={22} fill='currentColor' />
                                )}
                                {exporting ? t('account.activity.exporting') : t('account.activity.export')}
                            </Button>
                            {hasActiveFilters && (
                                <Button variant='ghost' onClick={clearAllFilters} className='flex items-center gap-1'>
                                    <Xmark width={20} height={20} fill='currentColor' />
                                    {t('account.activity.clear')}
                                </Button>
                            )}
                        </div>
                    </MainPageHeader>
                </div>

                <div className='mb-3 sm:mb-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]'>
                    <div className='relative'>
                        <Magnifier
                            width={18}
                            height={18}
                            className='pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-zinc-400'
                            fill='currentColor'
                        />
                        <Input.Text
                            id='activity-search'
                            type='text'
                            placeholder={t('account.activity.search_placeholder')}
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
                                aria-label={t('account.activity.clear_search')}
                            >
                                <Xmark width={16} height={16} fill='currentColor' />
                            </button>
                        )}
                    </div>
                    <Dropdown
                        id='activity-event-type'
                        value={selectedEventType}
                        onChange={selectEventType}
                        placeholder={t('account.activity.all_events')}
                        searchable
                        searchPlaceholder={t('account.activity.filter_events')}
                        triggerClassName='md:w-56'
                        options={eventOptions}
                    />
                    <Dropdown
                        id='activity-time-range'
                        value={dateRange}
                        onChange={(value) => {
                            setDateRange(value);
                            setPage(1);
                        }}
                        triggerClassName='md:w-44'
                        options={dateRangeOptions}
                    />
                </div>

                <div
                    className='transform-gpu skeleton-anim-2'
                    style={{
                        animationDelay: '125ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-4 hover:border-[#ffffff20] transition-all duration-150 shadow-sm'>
                        <div className='flex items-center gap-2 mb-4'>
                            <div className='w-5 h-5 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                                <Magnifier width={22} height={22} className='text-zinc-400' fill='currentColor' />
                            </div>
                            <h3 className='text-base font-semibold text-zinc-100'>
                                {t('account.activity.events_title')}
                            </h3>
                            <span className='text-sm text-zinc-400'>
                                {t(
                                    total === 1
                                        ? 'account.activity.events_count_one'
                                        : 'account.activity.events_count_other',
                                    { count: total },
                                )}
                            </span>
                        </div>

                        {!data && isValidating ? (
                            <Spinner centered />
                        ) : !data?.items?.length ? (
                            <div className='text-center py-12'>
                                <ArrowRotateLeft
                                    width={22}
                                    height={22}
                                    className='text-zinc-600 mb-4 mx-auto'
                                    fill='currentColor'
                                />
                                <h3 className='text-lg font-semibold text-zinc-300 mb-2'>
                                    {hasActiveFilters
                                        ? t('account.activity.empty_filtered_title')
                                        : t('account.activity.empty_title')}
                                </h3>
                                <p className='text-sm text-zinc-400 mb-4 max-w-lg mx-auto leading-relaxed'>
                                    {hasActiveFilters
                                        ? t('account.activity.empty_filtered_description')
                                        : t('account.activity.empty_description')}
                                </p>
                                {hasActiveFilters && (
                                    <div className='flex gap-2 justify-center'>
                                        <Button variant='secondary' onClick={clearAllFilters}>
                                            {t('account.activity.clear_filters')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className='divide-y divide-zinc-800/30'>
                                {data.items.map((activity) => (
                                    <ActivityLogEntry key={activity.id} activity={activity} />
                                ))}
                            </div>
                        )}

                        {data && (
                            <div className='mt-4'>
                                <PaginationFooter pagination={data.pagination} onPageSelect={setPage} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};

export default ActivityLogContainer;
