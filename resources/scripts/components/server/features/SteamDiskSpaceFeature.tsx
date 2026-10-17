import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';
import Modal from '@/components/elements/Modal';
import FlashMessageRender from '@/components/FlashMessageRender';
import { SocketEvent } from '@/components/server/events';
import { useTranslation } from '@/i18n/I18nProvider';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

const SteamDiskSpaceFeature = () => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [loading] = useState(false);

    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const isAdmin = useStoreState((state) => state.user.data?.rootAdmin);

    useEffect(() => {
        if (!connected || !instance || status === 'running') return;

        const errors = ['steamcmd needs 250mb of free disk space to update', '0x202 after update job'];

        const listener = (line: string) => {
            if (errors.some((p) => line.toLowerCase().includes(p))) {
                setVisible(true);
            }
        };

        instance.addListener(SocketEvent.CONSOLE_OUTPUT, listener);

        return () => {
            instance.removeListener(SocketEvent.CONSOLE_OUTPUT, listener);
        };
    }, [connected, instance, status]);

    useEffect(() => {
        clearFlashes('feature:steamDiskSpace');
    }, [clearFlashes]);

    return (
        <Modal
            visible={visible}
            onDismissed={() => setVisible(false)}
            showSpinnerOverlay={loading}
            dismissable={false}
            closeOnBackground={false}
            closeButton={true}
            title={t('server.features.steam_disk_space.title')}
        >
            <FlashMessageRender key={'feature:steamDiskSpace'} />
            <div className={`flex-col`}>
                {isAdmin ? (
                    <>
                        <p>{t('server.features.steam_disk_space.description')}</p>
                        <p className='mt-3'>
                            {t('server.features.steam_disk_space.admin_prefix')}{' '}
                            <code className={`font-mono bg-zinc-900 rounded-sm py-1 px-2`}>df -h</code>{' '}
                            {t('server.features.steam_disk_space.admin_suffix')}
                        </p>
                    </>
                ) : (
                    <p className={`mt-4`}>{t('server.features.steam_disk_space.user_description')}</p>
                )}
            </div>
        </Modal>
    );
};

export default SteamDiskSpaceFeature;
