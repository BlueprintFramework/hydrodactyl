import { type Actions, useStoreActions } from 'easy-peasy';
import { useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/http';
import reinstallServer from '@/api/server/reinstallServer';
import { Dialog } from '@/components/elements/dialog';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

const ReinstallServerBox = () => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const reinstall = () => {
        setLoading(true);
        clearFlashes('settings');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: t('server.settings.reinstall.started'),
                });
            })
            .catch((error) => {
                console.error(error);

                addFlash({
                    key: 'settings',
                    type: 'error',
                    message: httpErrorToHuman(error),
                });
            })
            .then(() => {
                setLoading(false);
                setModalVisible(false);
            });
    };

    useEffect(() => {
        clearFlashes();
    }, [clearFlashes]);

    return (
        <TitledGreyBox title={t('server.settings.reinstall.title')}>
            <Dialog.Confirm
                open={modalVisible}
                title={t('server.settings.reinstall.confirm_title')}
                confirm={t('server.settings.reinstall.confirm')}
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
                loading={loading}
            >
                {t('server.settings.reinstall.confirm_description')}
            </Dialog.Confirm>
            <p className={`text-sm`}>
                {t('server.settings.reinstall.description')}&nbsp;
                <strong className={`font-medium`}>{t('server.settings.reinstall.warning')}</strong>
            </p>
            <div className={`mt-6 text-right`}>
                <Button variant='attention' onClick={() => setModalVisible(true)}>
                    {t('server.settings.reinstall.title')}
                </Button>
            </div>
        </TitledGreyBox>
    );
};

export default ReinstallServerBox;
