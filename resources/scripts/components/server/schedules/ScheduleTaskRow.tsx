import { CircleQuestion, CloudArrowUpIn, PencilToLine, Power, Terminal, TrashBin } from '@gravity-ui/icons';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/http';
import deleteScheduleTask from '@/api/server/schedules/deleteScheduleTask';
import type { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import Can from '@/components/elements/Can';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import ItemContainer from '@/components/elements/ItemContainer';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import TaskDetailsModal from '@/components/server/schedules/TaskDetailsModal';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/types';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface Props {
    schedule: Schedule;
    task: Task;
}

const getActionDetails = (
    action: string,
): [
    TranslationKey,
    React.ComponentType<React.SVGProps<SVGSVGElement>> | typeof import('@gravity-ui/icons').Terminal,
    boolean?,
] => {
    switch (action) {
        case 'command':
            return ['server.schedules.task.row_command', Terminal, true];
        case 'power':
            return ['server.schedules.task.row_power', Power];
        case 'backup':
            return ['server.schedules.task.row_backup', CloudArrowUpIn];
        default:
            return ['server.schedules.task.row_unknown', CircleQuestion];
    }
};

const ScheduleTaskRow = ({ schedule, task }: Props) => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const { clearFlashes, addError } = useFlash();
    const [visible, setVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);

    const onConfirmDeletion = () => {
        setIsLoading(true);
        clearFlashes('schedules');
        deleteScheduleTask(uuid, schedule.id, task.id)
            .then(() =>
                appendSchedule({
                    ...schedule,
                    tasks: schedule.tasks.filter((t) => t.id !== task.id),
                }),
            )
            .catch((error) => {
                console.error(error);
                setIsLoading(false);
                addError({ message: httpErrorToHuman(error), key: 'schedules' });
            });
    };

    const [title, icon, copyOnClick] = getActionDetails(task.action);

    return (
        <ItemContainer
            title={t(title)}
            description={
                task.payload && task.payload.length > 100 ? `${task.payload.substring(0, 100)}...` : task.payload
            }
            icon={icon}
            divClasses={`mb-2 gap-6`}
            copyDescription={copyOnClick}
            descriptionClasses={`whitespace-nowrap overflow-hidden text-ellipsis`}
        >
            <SpinnerOverlay visible={isLoading} fixed size={'large'} />
            <TaskDetailsModal
                schedule={schedule}
                task={task}
                visible={isEditing}
                onDismissed={() => setIsEditing(false)}
            />
            <ConfirmationModal
                title={t('server.schedules.task.delete_confirm_title')}
                buttonText={t('server.schedules.task.delete_button')}
                onConfirmed={onConfirmDeletion}
                visible={visible}
                onModalDismissed={() => setVisible(false)}
            >
                {t('server.schedules.task.delete_confirm')}
            </ConfirmationModal>
            {/* <FontAwesomeIcon icon={icon} className={`text-lg text-white hidden md:block`} /> */}
            {/* <div className={`flex-none sm:flex-1 w-full sm:w-auto overflow-x-auto`}>
        <p className={`md:ml-6 text-zinc-200 uppercase text-sm`}>{title}</p>
        {task.payload && (
          <div className={`md:ml-6 mt-2`}>
            {task.action === 'backup' && (
              <p className={`text-xs uppercase text-zinc-400 mb-1`}>Ignoring files & folders:</p>
            )}
            <div
              className={`font-mono bg-zinc-800 rounded-sm py-1 px-2 text-sm w-auto inline-block whitespace-pre-wrap break-all`}
            >
              {task.payload && task.payload.length > 100
                ? `${task.payload.substring(0, 100)}...`
                : task.payload}
            </div>
          </div>
        )}
      </div> */}
            <div className={`flex flex-none items-end sm:items-center flex-col sm:flex-row gap-2`}>
                <div className='mr-0 sm:mr-6'>
                    {task.continueOnFailure && (
                        <div className={`px-2 py-1 bg-yellow-500 text-yellow-800 text-sm rounded-full`}>
                            {t('server.schedules.task.continues_on_failure')}
                        </div>
                    )}
                    {task.sequenceId > 1 && task.timeOffset > 0 && (
                        <div className={`px-2 py-1 bg-zinc-500 text-sm rounded-full`}>
                            {t('server.schedules.task.seconds_later', { seconds: task.timeOffset })}
                        </div>
                    )}
                </div>
                <Can action={'schedule.update'}>
                    <Button
                        variant='secondary'
                        size='sm'
                        className='flex flex-row items-center gap-2 ml-auto sm:ml-0'
                        onClick={() => setIsEditing(true)}
                        aria-label={t('server.schedules.task.edit_aria')}
                    >
                        <PencilToLine width={22} height={22} fill='currentColor' />
                        {t('common.edit')}
                    </Button>
                </Can>
                <Can action={'schedule.update'}>
                    <Button
                        variant='attention'
                        size='sm'
                        onClick={() => setVisible(true)}
                        className='flex items-center gap-2'
                        aria-label={t('server.schedules.task.delete_aria')}
                    >
                        <TrashBin width={22} height={22} fill='currentColor' className='w-4 h-4' />
                        <span className='hidden sm:inline'>{t('common.delete')}</span>
                    </Button>
                </Can>
            </div>
        </ItemContainer>
    );
};

export default ScheduleTaskRow;
