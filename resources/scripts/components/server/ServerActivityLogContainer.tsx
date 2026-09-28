import { ArrowDownToLine, ClockArrowRotateLeft, Funnel, Magnifier, Xmark } from '@gravity-ui/icons';
import { useEffect, useMemo, useState } from 'react';
import type { ActivityLogFilters } from '@/api/account/activity';
import { useActivityLogs } from '@/api/server/activity';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Select from '@/components/elements/Select';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import FlashMessageRender from '@/components/FlashMessageRender';
import ServerHeader from '@/components/server/header/ServerHeader';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

import { useFlashKey } from '@/plugins/useFlash';
import useLocationHash from '@/plugins/useLocationHash';

const ServerActivityLogContainer = () => {
    const { t } = useTranslation();
    const { hash } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('server:activity');
    const [filters, setFilters] = useState<ActivityLogFilters>({
        page: 1,
        sorts: { timestamp: -1 },
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEventType, setSelectedEventType] = useState('');
    const [showFilters, setShowFilters] = useState(false);
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

        if (searchTerm) {
            filtered = filtered.filter(
                (item) =>
                    item.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.relationships.actor?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    JSON.stringify(item.properties).toLowerCase().includes(searchTerm.toLowerCase()),
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
    }, [data, searchTerm, selectedEventType, dateRange]);

    const exportLogs = () => {
        if (!filteredData?.items) return;

        const csvContent = [
            [
                t('server.activity.csv_timestamp'),
                t('server.activity.csv_event'),
                t('server.activity.csv_actor'),
                t('server.activity.csv_ip_address'),
                t('server.activity.csv_properties'),
            ].join(','),
            ...filteredData.items.map((item) =>
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
    };

    const clearAllFilters = () => {
        setFilters((value) => ({ ...value, filters: {} }));
        setSearchTerm('');
        setSelectedEventType('');
        setDateRange('all');
    };

    const hasActiveFilters =
        filters.filters?.event || filters.filters?.ip || searchTerm || selectedEventType || dateRange !== 'all';

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'f':
                        e.preventDefault();
                        setShowFilters(!showFilters);
                        break;
                    case 'e':
                        e.preventDefault();
                        exportLogs();
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // biome-ignore lint/correctness/useExhaustiveDependencies: handleKeyDown uses refs for callbacks
    }, [showFilters, exportLogs]);

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
        <ServerContentBlock title={t('server.activity.title')} showFlashKey={'activity'}>
            <ServerHeader />
            <div className='w-full h-full min-h-full flex-1 flex flex-col px-2 sm:px-0'>
                <FlashMessageRender byKey={'server:activity'} />

                <ErrorBoundary>
                    <div
                        className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                        style={{
                            animationDelay: '75ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <MainPageHeader
                            direction='column'
                            title={t('server.activity.title')}
                            titleChildren={
                                <div className='flex gap-2 items-center flex-wrap'>
                                    <Button
                                        variant='secondary'
                                        onClick={() => setShowFilters(!showFilters)}
                                        className='flex items-center gap-2'
                                        title={t('server.activity.toggle_filters')}
                                    >
                                        <Funnel width={22} height={22} className='w-4 h-4' fill='currentColor' />
                                        {t('server.activity.filters')}
                                        {hasActiveFilters && <span className='w-2 h-2 bg-brand rounded-full'></span>}
                                    </Button>
                                    <Button
                                        variant='secondary'
                                        onClick={exportLogs}
                                        disabled={!filteredData?.items?.length}
                                        className='flex items-center gap-2'
                                        title={t('server.activity.export_csv')}
                                    >
                                        <ArrowDownToLine
                                            width={22}
                                            height={22}
                                            className='w-4 h-4'
                                            fill='currentColor'
                                        />
                                        {t('server.activity.export')}
                                    </Button>
                                </div>
                            }
                        >
                            <p className='text-sm text-neutral-400 leading-relaxed'>
                                {t('server.activity.description')}
                            </p>
                        </MainPageHeader>
                    </div>
                </ErrorBoundary>

                <ErrorBoundary>
                    {showFilters && (
                        <div
                            className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                            style={{
                                animationDelay: '100ms',
                                animationTimingFunction:
                                    'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                            }}
                        >
                            <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-4 hover:border-[#ffffff20] transition-all duration-150 shadow-sm'>
                                <div className='flex items-center gap-2 mb-4'>
                                    <div className='w-5 h-5 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                                        <Funnel
                                            width={22}
                                            height={22}
                                            className='w-2.5 h-2.5 text-zinc-400'
                                            fill='currentColor'
                                        />
                                    </div>
                                    <h3 className='text-base font-semibold text-zinc-100'>
                                        {t('server.activity.filters')}
                                    </h3>
                                </div>

                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                    <div>
                                        <label
                                            htmlFor='server-activity-search'
                                            className='block text-sm font-medium text-zinc-300 mb-2'
                                        >
                                            {t('common.search')}
                                        </label>
                                        <div className='relative'>
                                            <Magnifier
                                                width={22}
                                                height={22}
                                                className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none z-10'
                                                fill='currentColor'
                                            />
                                            <Input.Text
                                                id='server-activity-search'
                                                type='text'
                                                placeholder={t('server.activity.search_placeholder')}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                style={{ paddingLeft: '2.5rem' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor='server-activity-event-type'
                                            className='block text-sm font-medium text-zinc-300 mb-2'
                                        >
                                            {t('server.activity.event_type')}
                                        </label>
                                        <Select
                                            id='server-activity-event-type'
                                            value={selectedEventType}
                                            onChange={(e) => setSelectedEventType(e.target.value)}
                                            className='w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 focus:border-brand focus:ring-1 focus:ring-brand hover:border-zinc-500 transition-colors duration-150'
                                        >
                                            <option value='' style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}>
                                                {t('server.activity.all_events')}
                                            </option>
                                            {eventTypes.map((type) => (
                                                <option
                                                    key={type}
                                                    value={type}
                                                    style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}
                                                >
                                                    {type}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor='server-activity-time-range'
                                            className='block text-sm font-medium text-zinc-300 mb-2'
                                        >
                                            {t('server.activity.time_range')}
                                        </label>
                                        <Select
                                            id='server-activity-time-range'
                                            value={dateRange}
                                            onChange={(e) => setDateRange(e.target.value)}
                                            className='w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-100 focus:border-brand focus:ring-1 focus:ring-brand hover:border-zinc-500 transition-colors duration-150'
                                        >
                                            <option
                                                value='all'
                                                style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}
                                            >
                                                {t('server.activity.all_time')}
                                            </option>
                                            <option value='1h' style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}>
                                                {t('server.activity.last_hour')}
                                            </option>
                                            <option
                                                value='24h'
                                                style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}
                                            >
                                                {t('server.activity.last_24_hours')}
                                            </option>
                                            <option value='7d' style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}>
                                                {t('server.activity.last_7_days')}
                                            </option>
                                            <option
                                                value='30d'
                                                style={{ backgroundColor: '#27272a', color: '#f4f4f5' }}
                                            >
                                                {t('server.activity.last_30_days')}
                                            </option>
                                        </Select>
                                    </div>

                                    <div className='flex items-end'>
                                        {hasActiveFilters && (
                                            <Button
                                                variant='secondary'
                                                onClick={clearAllFilters}
                                                className='flex items-center gap-2 w-full'
                                            >
                                                <Xmark width={22} height={22} className='w-4 h-4' fill='currentColor' />
                                                {t('server.activity.clear_filters')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                                    <ClockArrowRotateLeft
                                        width={22}
                                        height={22}
                                        className=' text-zinc-400'
                                        fill='currentColor'
                                    />
                                </div>
                                <h3 className='text-base font-semibold text-zinc-100'>
                                    {t('server.activity.events_title')}
                                </h3>
                                {filteredData?.items && (
                                    <span className='text-sm text-zinc-400'>
                                        {t(
                                            filteredData.items.length === 1
                                                ? 'server.activity.events_count_one'
                                                : 'server.activity.events_count_other',
                                            { count: filteredData.items.length },
                                        )}
                                    </span>
                                )}
                            </div>

                            {!data && isValidating ? (
                                <Spinner centered />
                            ) : !filteredData?.items?.length ? (
                                <div className='text-center py-12'>
                                    <h3 className='text-lg font-semibold text-zinc-300 mb-2'>
                                        {hasActiveFilters
                                            ? t('server.activity.empty_filtered_title')
                                            : t('server.activity.empty_title')}
                                    </h3>
                                    <p className='text-sm text-zinc-400 mb-4 max-w-lg mx-auto leading-relaxed'>
                                        {hasActiveFilters
                                            ? t('server.activity.empty_filtered_description')
                                            : t('server.activity.empty_description')}
                                    </p>
                                    {hasActiveFilters && (
                                        <div className='flex gap-2 justify-center'>
                                            <Button variant='secondary' onClick={clearAllFilters}>
                                                {t('server.activity.clear_filters')}
                                            </Button>
                                            <Button variant='secondary' onClick={() => setShowFilters(true)}>
                                                {t('server.activity.adjust_filters')}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className='divide-y divide-zinc-800/30'>
                                    {filteredData.items.map((activity) => (
                                        <ActivityLogEntry key={activity.id} activity={activity}>
                                            <span />
                                        </ActivityLogEntry>
                                    ))}
                                </div>
                            )}

                            {data && (
                                <div className='mt-4'>
                                    <PaginationFooter
                                        pagination={data.pagination}
                                        onPageSelect={(page) => setFilters((value) => ({ ...value, page }))}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </ErrorBoundary>
            </div>
        </ServerContentBlock>
    );
};

export default ServerActivityLogContainer;
