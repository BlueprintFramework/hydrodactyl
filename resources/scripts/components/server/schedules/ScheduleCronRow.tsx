import clsx from 'clsx';

import type { Schedule } from '@/api/server/schedules/getServerSchedules';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
    cron: Schedule['cron'];
    className?: string;
}

const ScheduleCronRow = ({ cron, className }: Props) => {
    const { t } = useTranslation();

    return (
        <div className={clsx('flex flex-wrap gap-4 justify-center m-auto', className)}>
            <div className={'text-center'}>
                <p className={'font-medium'}>{cron.minute}</p>
                <p className={'text-xs text-zinc-500 uppercase'}>{t('server.schedules.cron.minute')}</p>
            </div>
            <div className={'text-center'}>
                <p className={'font-medium'}>{cron.hour}</p>
                <p className={'text-xs text-zinc-500 uppercase'}>{t('server.schedules.cron.hour')}</p>
            </div>
            <div className={'text-center'}>
                <p className={'font-medium'}>{cron.dayOfMonth}</p>
                <p className={'text-xs text-zinc-500 uppercase'}>{t('server.schedules.cron.day_of_month')}</p>
            </div>
            <div className={'text-center'}>
                <p className={'font-medium'}>{cron.month}</p>
                <p className={'text-xs text-zinc-500 uppercase'}>{t('server.schedules.cron.month')}</p>
            </div>
            <div className={'text-center'}>
                <p className={'font-medium'}>{cron.dayOfWeek}</p>
                <p className={'text-xs text-zinc-500 uppercase'}>{t('server.schedules.cron.day_of_week')}</p>
            </div>
        </div>
    );
};

export default ScheduleCronRow;
