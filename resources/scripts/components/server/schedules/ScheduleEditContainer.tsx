import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import { useParams } from 'react-router-dom';
import getServerSchedule from '@/api/server/schedules/getServerSchedule';
import triggerScheduleExecution from '@/api/server/schedules/triggerScheduleExecution';
import Can from '@/components/elements/Can';
import ItemContainer from '@/components/elements/ItemContainer';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import ServerHeader from '@/components/server/header/ServerHeader';
import EditScheduleModal from '@/components/server/schedules/EditScheduleModal';
import ScheduleTaskRow from '@/components/server/schedules/ScheduleTaskRow';
import TaskDetailsModal from '@/components/server/schedules/TaskDetailsModal';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

const CronBox = ({ title, value }: { title: string; value: string }) => (
    <ItemContainer title={title} description={value} />
);

const ActivePill = ({ active }: { active: boolean }) => {
    const { t } = useTranslation();

    return (
        <span className='flex items-center rounded-full px-2 py-px text-xs ml-4 uppercase bg-neutral-600 text-white'>
            {active ? t('common.active') : t('common.inactive')}
        </span>
    );
};

const ScheduleEditContainer = () => {
    const { t, dateFnsLocale } = useTranslation();
    const { id: scheduleId } = useParams<'id'>();

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [runLoading, setRunLoading] = useState(false);

    const schedule = ServerContext.useStoreState(
        (st) => st.schedules.data.find((s) => s.id === Number(scheduleId)),
        isEqual,
    );
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    useEffect(() => {
        if (schedule?.id === Number(scheduleId)) {
            setIsLoading(false);
            return;
        }

        clearFlashes('schedules');
        getServerSchedule(uuid, Number(scheduleId))
            .then((schedule) => appendSchedule(schedule))
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ error, key: 'schedules' });
            })
            .then(() => setIsLoading(false));
    }, [scheduleId, clearAndAddHttpError, uuid, schedule?.id, clearFlashes, appendSchedule]);

    const toggleEditModal = useCallback(() => {
        setShowEditModal((s) => !s);
    }, []);

    const onTriggerExecute = useCallback(() => {
        clearFlashes('schedule');
        setRunLoading(true);
        triggerScheduleExecution(id, schedule?.id)
            .then(() => {
                setRunLoading(false);
                if (!schedule) return;
                appendSchedule({ ...schedule, isProcessing: true });
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ error, key: 'schedules' });
            })
            .then(() => setRunLoading(false));
    }, [schedule, id, clearFlashes, clearAndAddHttpError, appendSchedule]);

    return (
        <PageContentBlock title={t('navigation.schedules')}>
            <ServerHeader />
            <FlashMessageRender byKey={'schedules'} />
            {!schedule || isLoading ? (
                <Spinner size={'large'} centered />
            ) : (
                <div className={`rounded-sm shadow-sm flex flex-col gap-6`}>
                    <div
                        className={`bg-[#ffffff09] border-[1px] border-[#ffffff11] flex items-center place-content-between flex-col md:flex-row gap-6 p-6 rounded-2xl overflow-hidden`}
                    >
                        <div className={`flex-none self-start`}>
                            <h3 className={`flex items-center text-neutral-100 text-2xl`}>
                                {schedule.name}
                                {schedule.isProcessing ? (
                                    <span
                                        className={`flex items-center rounded-full px-2 py-px text-xs ml-4 uppercase bg-neutral-600 text-white`}
                                    >
                                        {t('server.schedules.processing')}
                                    </span>
                                ) : (
                                    <ActivePill active={schedule.isActive} />
                                )}
                            </h3>
                            <p className={`mt-1 text-sm`}>
                                <strong>{t('server.schedules.last_run_at')}&nbsp;</strong>
                                {schedule.lastRunAt ? (
                                    format(schedule.lastRunAt, "MMM do 'at' h:mma", { locale: dateFnsLocale })
                                ) : (
                                    <span>{t('common.not_available')}</span>
                                )}

                                <span className={`ml-4 pl-4 border-l-4 border-neutral-600 py-px hidden sm:inline`} />
                                <br className={`sm:hidden`} />

                                <strong>{t('server.schedules.next_run_at')}&nbsp;</strong>
                                {schedule.nextRunAt ? (
                                    format(schedule.nextRunAt, "MMM do 'at' h:mma", { locale: dateFnsLocale })
                                ) : (
                                    <span>{t('common.not_available')}</span>
                                )}
                            </p>
                        </div>
                        <div className={`flex gap-2 flex-col md:flex-row md:min-w-0 min-w-full`}>
                            <Can action={'schedule.update'}>
                                <Button variant='secondary' onClick={toggleEditModal} className={'flex-1 min-w-max'}>
                                    {t('common.edit')}
                                </Button>
                                <Button
                                    variant='secondary'
                                    onClick={() => setShowTaskModal(true)}
                                    className={'flex-1 min-w-max'}
                                >
                                    {t('server.schedules.new_task')}
                                </Button>
                            </Can>
                        </div>
                    </div>
                    <div className={`grid grid-cols-3 sm:grid-cols-5 gap-4`}>
                        <CronBox title={t('server.schedules.cron.minute')} value={schedule.cron.minute} />
                        <CronBox title={t('server.schedules.cron.hour')} value={schedule.cron.hour} />
                        <CronBox title={t('server.schedules.cron.day_of_month')} value={schedule.cron.dayOfMonth} />
                        <CronBox title={t('server.schedules.cron.month')} value={schedule.cron.month} />
                        <CronBox title={t('server.schedules.cron.day_of_week')} value={schedule.cron.dayOfWeek} />
                    </div>
                    <div>
                        {schedule.tasks.length > 0
                            ? schedule.tasks
                                  .sort((a, b) =>
                                      a.sequenceId === b.sequenceId ? 0 : a.sequenceId > b.sequenceId ? 1 : -1,
                                  )
                                  .map((task) => (
                                      <ScheduleTaskRow
                                          key={`${schedule.id}_${task.id}`}
                                          task={task}
                                          schedule={schedule}
                                      />
                                  ))
                            : null}
                    </div>
                    <EditScheduleModal visible={showEditModal} schedule={schedule} onDismissed={toggleEditModal} />
                    <div className={`gap-3 flex sm:justify-end`}>
                        {schedule.tasks.length > 0 && (
                            <Can action={'schedule.update'}>
                                <SpinnerOverlay visible={runLoading} size={'large'} />
                                <Button
                                    className={'flex-1 sm:flex-none'}
                                    disabled={schedule.isProcessing}
                                    onClick={onTriggerExecute}
                                >
                                    {t('server.schedules.run_now')}
                                </Button>
                            </Can>
                        )}
                    </div>
                    <TaskDetailsModal
                        schedule={schedule}
                        visible={showTaskModal}
                        onDismissed={() => setShowTaskModal(false)}
                    />
                </div>
            )}
        </PageContentBlock>
    );
};

export default ScheduleEditContainer;
