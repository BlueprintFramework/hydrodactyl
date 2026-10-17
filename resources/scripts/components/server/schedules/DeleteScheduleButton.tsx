import { type Actions, useStoreActions } from 'easy-peasy';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/http';
import deleteSchedule from '@/api/server/schedules/deleteSchedule';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/ui/button';

import { useTranslation } from '@/i18n/I18nProvider';
import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface Props {
    scheduleId: number;
    onDeleted: () => void;
}

const DeleteScheduleButton = ({ scheduleId, onDeleted }: Props) => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const onDelete = () => {
        setIsLoading(true);
        clearFlashes('schedules');
        deleteSchedule(uuid, scheduleId)
            .then(() => {
                setIsLoading(false);
                onDeleted();
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
            <Button variant='destructive' className={'flex-1 sm:flex-none'} onClick={() => setVisible(true)}>
                {t('common.delete')}
            </Button>
        </>
    );
};

export default DeleteScheduleButton;
