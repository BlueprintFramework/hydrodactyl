import { useEffect, useState } from 'react';
import saveFileContents from '@/api/server/files/saveFileContents';
import Modal from '@/components/elements/Modal';
import FlashMessageRender from '@/components/FlashMessageRender';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

const EulaModalFeature = () => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);

    useEffect(() => {
        if (!connected || !instance || status === 'running') return;

        const listener = (line: string) => {
            if (line.toLowerCase().indexOf('you need to agree to the eula in order to run the server') >= 0) {
                setVisible(true);
            }
        };

        instance.addListener(SocketEvent.CONSOLE_OUTPUT, listener);

        return () => {
            instance.removeListener(SocketEvent.CONSOLE_OUTPUT, listener);
        };
    }, [connected, instance, status]);

    const onAcceptEULA = () => {
        setLoading(true);
        clearFlashes('feature:eula');

        saveFileContents(uuid, 'eula.txt', 'eula=true')
            .then(() => {
                if (status === 'offline' && instance) {
                    instance.send(SocketRequest.SET_STATE, 'restart');
                }

                setLoading(false);
                setVisible(false);
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'feature:eula', error });
            })
            .then(() => setLoading(false));
    };

    useEffect(() => {
        clearFlashes('feature:eula');
    }, [clearFlashes]);

    return (
        <Modal
            visible={visible}
            onDismissed={() => setVisible(false)}
            closeOnBackground={false}
            showSpinnerOverlay={loading}
            title={t('server.features.eula.title')}
        >
            <div className='flex flex-col'>
                <FlashMessageRender key={'feature:eula'} />
                <p className={`text-zinc-200`}>
                    {t('server.features.eula.description_prefix')}{' '}
                    <a
                        target={'_blank'}
                        className={`text-zinc-300 underline transition-colors duration-150 hover:text-zinc-400`}
                        rel={'noreferrer noopener'}
                        href='https://www.aka.ms/MinecraftEULA'
                    >
                        Minecraft EULA
                    </a>
                    .
                </p>
                <div className={`my-6 gap-3 flex items-center justify-end`}>
                    <Button variant='secondary' onClick={() => setVisible(false)}>
                        {t('server.features.eula.decline')}
                    </Button>
                    <Button variant='attention' onClick={onAcceptEULA}>
                        {t('server.features.eula.accept')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default EulaModalFeature;
