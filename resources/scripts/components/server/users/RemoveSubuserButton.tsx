import { TrashBin } from '@gravity-ui/icons';
import { type Actions, useStoreActions } from 'easy-peasy';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/http';
import deleteSubuser from '@/api/server/users/deleteSubuser';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import type { Subuser } from '@/state/server/subusers';

const RemoveSubuserButton = ({ subuser }: { subuser: Subuser }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const removeSubuser = ServerContext.useStoreActions((actions) => actions.subusers.removeSubuser);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const doDeletion = () => {
        setLoading(true);
        clearFlashes('users');
        deleteSubuser(uuid, subuser.uuid)
            .then(() => {
                setLoading(false);
                removeSubuser(subuser.uuid);
                setShowConfirmation(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'users', message: httpErrorToHuman(error) });
                setShowConfirmation(false);
            });
    };

    return (
        <>
            <ConfirmationModal
                title={t('server.users.remove_title', { username: subuser.username })}
                buttonText={t('server.users.remove_button', { username: subuser.username })}
                visible={showConfirmation}
                loading={loading}
                onConfirmed={() => doDeletion()}
                onModalDismissed={() => setShowConfirmation(false)}
            >
                {t('server.users.remove_description')}
            </ConfirmationModal>
            <Button
                variant='attention'
                size='sm'
                className='p-2'
                onClick={() => setShowConfirmation(true)}
                title={t('server.users.delete_subuser')}
            >
                <TrashBin width={22} height={22} fill='currentColor' />
            </Button>
        </>
    );
};

export default RemoveSubuserButton;
