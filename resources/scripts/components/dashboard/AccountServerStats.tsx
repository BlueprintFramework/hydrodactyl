import useSWR from 'swr';
import getServerCount, { type ServerAccessType } from '@/api/getServerCount';
import AccountSection from '@/components/dashboard/AccountSection';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/i18n/I18nProvider';

const SIZE = 104;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function useServerCount(type: ServerAccessType) {
    const { data } = useSWR(['server:count', type], () => getServerCount(type), {
        revalidateOnFocus: false,
    });

    return data;
}

/**
 * Split of the account's servers between the ones it owns and the ones it only
 * reaches as a subuser, drawn as a two-slice donut.
 */
const AccountServerStats = () => {
    const { t } = useTranslation();
    const owned = useServerCount('owner');
    const shared = useServerCount('shared');
    const loading = owned === undefined || shared === undefined;

    const ownedCount = owned ?? 0;
    const sharedCount = shared ?? 0;
    const total = ownedCount + sharedCount;
    const ownedArc = total > 0 ? (ownedCount / total) * CIRCUMFERENCE : 0;
    const sharedArc = total > 0 ? CIRCUMFERENCE - ownedArc : 0;

    const chartLabel = t('account.servers.chart_label', { owned: ownedCount, shared: sharedCount });

    return (
        <AccountSection title={t('account.servers.title')} description={t('account.servers.description')}>
            {!loading && total === 0 ? (
                <p className='text-sm text-secondary'>{t('account.servers.empty')}</p>
            ) : (
                <div className='flex items-center gap-5'>
                    <div className='relative size-26 shrink-0'>
                        <svg
                            viewBox={`0 0 ${SIZE} ${SIZE}`}
                            className='size-full -rotate-90'
                            role='img'
                            aria-label={chartLabel}
                        >
                            <circle
                                cx={SIZE / 2}
                                cy={SIZE / 2}
                                r={RADIUS}
                                fill='none'
                                strokeWidth={STROKE}
                                className='stroke-mocha-400'
                            />
                            {total > 0 && (
                                <>
                                    <circle
                                        cx={SIZE / 2}
                                        cy={SIZE / 2}
                                        r={RADIUS}
                                        fill='none'
                                        strokeWidth={STROKE}
                                        className='stroke-hydro-500 transition-all duration-500 ease-out'
                                        strokeDasharray={`${ownedArc} ${CIRCUMFERENCE - ownedArc}`}
                                    />
                                    <circle
                                        cx={SIZE / 2}
                                        cy={SIZE / 2}
                                        r={RADIUS}
                                        fill='none'
                                        strokeWidth={STROKE}
                                        className='stroke-hydro-700 transition-all duration-500 ease-out'
                                        strokeDasharray={`${sharedArc} ${CIRCUMFERENCE - sharedArc}`}
                                        strokeDashoffset={-ownedArc}
                                    />
                                </>
                            )}
                        </svg>
                        <div className='absolute inset-0 flex flex-col items-center justify-center'>
                            {loading ? (
                                <Skeleton className='h-6 w-8' />
                            ) : (
                                <span className='text-xl font-semibold tabular-nums'>{total}</span>
                            )}
                            <span className='text-[10px] tracking-wide text-secondary uppercase'>
                                {t('account.servers.total')}
                            </span>
                        </div>
                    </div>

                    <dl className='flex min-w-0 flex-1 flex-col gap-3'>
                        <div className='flex items-center gap-2'>
                            <span aria-hidden='true' className='size-2.5 shrink-0 rounded-full bg-hydro-500' />
                            <dt className='min-w-0 flex-1 truncate text-sm text-secondary'>
                                {t('account.servers.owned')}
                            </dt>
                            <dd className='text-sm font-semibold tabular-nums'>
                                {loading ? <Skeleton className='h-4 w-6' /> : ownedCount}
                            </dd>
                        </div>
                        <div className='flex items-center gap-2'>
                            <span aria-hidden='true' className='size-2.5 shrink-0 rounded-full bg-hydro-700' />
                            <dt className='min-w-0 flex-1 truncate text-sm text-secondary'>
                                {t('account.servers.shared')}
                            </dt>
                            <dd className='text-sm font-semibold tabular-nums'>
                                {loading ? <Skeleton className='h-4 w-6' /> : sharedCount}
                            </dd>
                        </div>
                    </dl>
                </div>
            )}
        </AccountSection>
    );
};

export default AccountServerStats;
