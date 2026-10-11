import { useEffect, useState } from 'react';
import setSelectedDockerImage from '@/api/server/setSelectedDockerImage';
import getServerStartup from '@/api/swr/getServerStartup';
import Can from '@/components/elements/Can';
import Dropdown from '@/components/elements/Dropdown';
import Modal from '@/components/elements/Modal';
import Spinner from '@/components/elements/Spinner';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import { Button } from '@/components/ui/button';
import useFlash from '@/plugins/useFlash';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { ServerContext } from '@/state/server';

// FIXME: use regex
const MATCH_ERRORS = [
    'minecraft 1.17 requires running the server with java 16 or above',
    'minecraft 1.18 requires running the server with java 17 or above',
    'minecraft 1.19 requires running the server with java 17 or above',
    'java.lang.unsupportedclassversionerror',
    'unsupported major.minor version',
    'has been compiled by a more recent version of the java runtime',
];

const JavaVersionModalFeature = () => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState('');

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { instance } = ServerContext.useStoreState((state) => state.socket);

    const { data, isValidating, mutate } = getServerStartup(uuid, undefined, {
        revalidateOnMount: false,
    });

    useEffect(() => {
        if (!visible) return;

        mutate().then((value) => {
            setSelectedVersion(Object.values(value?.dockerImages || [])[0] || '');
        });
    }, [visible, mutate]);

    useWebsocketEvent(SocketEvent.CONSOLE_OUTPUT, (data) => {
        if (status === 'running') return;

        if (MATCH_ERRORS.some((p) => data.toLowerCase().includes(p.toLowerCase()))) {
            setVisible(true);
        }
    });

    const updateJava = () => {
        setLoading(true);
        clearFlashes('feature:javaVersion');

        setSelectedDockerImage(uuid, selectedVersion)
            .then(() => {
                if (status === 'offline' && instance) {
                    instance.send(SocketRequest.SET_STATE, 'restart');
                }
                setVisible(false);
            })
            .catch((error) => clearAndAddHttpError({ key: 'feature:javaVersion', error }))
            .then(() => setLoading(false));
    };

    useEffect(() => {
        clearFlashes('feature:javaVersion');
    }, [clearFlashes]);

    return (
        <Modal
            visible={visible}
            onDismissed={() => setVisible(false)}
            closeOnBackground={false}
            showSpinnerOverlay={loading}
            title='Unsupported Java Version'
        >
            <div className='flex flex-col gap-4 w-full h-full'>
                {/*<FlashMessageRender key={'feature:javaVersion'} />*/}
                <p>
                    This server is currently running an unsupported version of Java and cannot be started. Please select
                    a supported version from the list below to continue starting the server.
                </p>
                <div className={`mt-6 flex flex-row justify-end items-center gap-3 my-4`}>
                    <Can action={'startup.docker-image'}>
                        <Spinner size='small' visible={!data || isValidating} />
                        <Dropdown
                            value={selectedVersion}
                            onChange={setSelectedVersion}
                            disabled={!data}
                            placeholder='Select a version'
                            triggerClassName='h-8 w-auto px-4'
                            options={
                                data
                                    ? Object.keys(data.dockerImages).map((key) => ({
                                          value: data.dockerImages[key] || '',
                                          label: key,
                                      }))
                                    : []
                            }
                        />
                    </Can>
                    {/* <Button variant={Options.Variant.Secondary} onClick={() => setVisible(false)}>
            Cancel
          </Button> */}
                    <Can action={'startup.docker-image'}>
                        <Button variant='attention' onClick={updateJava} className={`w-full sm:w-auto`}>
                            Update
                        </Button>
                    </Can>
                </div>
            </div>
        </Modal>
    );
};

export default JavaVersionModalFeature;
