import { Calendar, Pencil, TrashBin } from '@gravity-ui/icons';
import { format } from 'date-fns';
import { type Actions, useStoreActions } from 'easy-peasy';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpErrorToHuman } from '@/api/http';
import deleteSchedule from '@/api/server/schedules/deleteSchedule';
import type { Schedule } from '@/api/server/schedules/getServerSchedules';
import Can from '@/components/elements/Can';
import { Dialog } from '@/components/elements/dialog';
import ScheduleCronRow from '@/components/server/schedules/ScheduleCronRow';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface Props {
    schedule: Schedule;
    onDeleted?: () => void;
}

const ScheduleRow = ({ schedule, onDeleted }: Props) => {
    const { t, dateFnsLocale } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const onDelete = () => {
        setIsLoading(true);
        clearFlashes('schedules');
        deleteSchedule(uuid, schedule.id)
            .then(() => {
                setIsLoading(false);
                onDeleted?.();
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'schedules', message: httpErrorToHuman(error) });
                setIsLoading(false);
                setVisible(false);
            });
    };

    return (
        <>
            <div className='flex flex-col gap-3 w-full'>
                <div className='flex items-center justify-between gap-3 w-full'>
                    <div className='flex flex-row flex-1 align-middle items-center gap-3 min-w-0'>
                        <Calendar width={25} height={25} className='flex-none w-9 h-9' fill='currentColor' />
                        <div className='min-w-0'>
                            <div className='flex flex-row items-center gap-2 text-lg'>
                                <p className='truncate'>{schedule.name}</p>
                            </div>
                            <p className='text-xs text-zinc-400'>
                                {t('server.schedules.last_run_at')}{' '}
                                {schedule.lastRunAt
                                    ? format(schedule.lastRunAt, "MMM do 'at' h:mma", { locale: dateFnsLocale })
                                    : t('common.not_available')}
                            </p>
                        </div>
                        <div className='flex-none w-20 sm:ml-2 flex items-center align-middle justify-center ml-auto'>
                            <p className='rounded-full px-2 py-px text-xs uppercase bg-neutral-600 text-white'>
                                {schedule.isProcessing
                                    ? t('server.schedules.processing')
                                    : schedule.isActive
                                      ? t('common.active')
                                      : t('common.inactive')}
                            </p>
                        </div>
                    </div>
                    <div className='flex-shrink-0 flex items-center gap-2 min-w-[68px] justify-end'>
                        <Can action={'schedule.update'}>
                            <Button
                                variant='secondary'
                                size='sm'
                                className={`p-2 border transition-colors`}
                                title={t('server.schedules.edit_tooltip')}
                                onClick={() => navigate(`/server/${serverId}/schedules/${schedule.id}`)}
                            >
                                <Pencil width={22} height={22} fill='currentColor' />
                            </Button>
                        </Can>
                        <Can action={'schedule.delete'}>
                            <Button
                                variant='attention'
                                size='sm'
                                className={`p-2 border transition-colors`}
                                title={t('server.schedules.delete_title')}
                                onClick={() => setVisible(true)}
                            >
                                <TrashBin width={22} height={22} fill='currentColor' />
                            </Button>
                        </Can>
                    </div>
                </div>
                <ScheduleCronRow cron={schedule.cron} className='sm:ml-12' />
            </div>

            <Dialog.Confirm
                open={visible}
                onClose={() => setVisible(false)}
                title={t('server.schedules.delete_title')}
                confirm={t('common.delete')}
                onConfirmed={onDelete}
                loading={isLoading}
            >
                {t('server.schedules.delete_confirm')}
            </Dialog.Confirm>
        </>
    );
};

export default ScheduleRow;
