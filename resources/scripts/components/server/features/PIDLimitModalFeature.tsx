import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';
import Modal from '@/components/elements/Modal';
import FlashMessageRender from '@/components/FlashMessageRender';
import { SocketEvent } from '@/components/server/events';
import { useTranslation } from '@/i18n/I18nProvider';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

const PIDLimitModalFeature = () => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [loading] = useState(false);

    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const isAdmin = useStoreState((state) => state.user.data?.rootAdmin);

    useEffect(() => {
        if (!connected || !instance || status === 'running') return;

        const errors = [
            'pthread_create failed',
            'failed to create thread',
            'unable to create thread',
            'unable to create native thread',
            'unable to create new native thread',
            'exception in thread "craft async scheduler management thread"',
        ];

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
        clearFlashes('feature:pidLimit');
    }, [clearFlashes]);

    return (
        <Modal
            visible={visible}
            onDismissed={() => setVisible(false)}
            showSpinnerOverlay={loading}
            dismissable={false}
            closeOnBackground={false}
            closeButton={true}
            title={isAdmin ? t('server.features.pid_limit.title_admin') : t('server.features.pid_limit.title_user')}
        >
            <FlashMessageRender key={'feature:pidLimit'} />
            <div className={`flex-col`}>
                {isAdmin ? (
                    <>
                        <p>
                            {t('server.features.pid_limit.admin_prefix')}{' '}
                            <code className={`font-mono bg-zinc-900`}>container_pid_limit</code>{' '}
                            {t('server.features.pid_limit.admin_middle')}{' '}
                            <code className={`font-mono bg-zinc-900`}>config.yml</code>
                            {t('server.features.pid_limit.admin_suffix')}
                        </p>
                        <p className='mt-3'>
                            <b>{t('server.features.pid_limit.admin_note')}</b>
                        </p>
                    </>
                ) : (
                    <>
                        <p>{t('server.features.pid_limit.user_description')}</p>
                        <p className='mt-3'>
                            <code className={`font-mono bg-zinc-900`}>
                                pthread_create failed, Possibly out of memory or process/resource limits reached
                            </code>
                        </p>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default PIDLimitModalFeature;
