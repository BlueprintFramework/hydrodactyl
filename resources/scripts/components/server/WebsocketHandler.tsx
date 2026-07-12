import { useEffect, useRef, useState } from 'react';
import getWebsocketToken from '@/api/server/getWebsocketToken';
import Spinner from '@/components/elements/Spinner';
import FadeTransition from '@/components/elements/transitions/FadeTransition';
import { Websocket } from '@/plugins/Websocket';
import { ServerContext } from '@/state/server';

const reconnectErrors = ['jwt: exp claim is invalid', 'jwt: created too far in past (denylist)'];

function WebsocketHandler() {
    let updatingToken = false;
    const [error, setError] = useState<'connecting' | string>('');
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const setServerStatus = ServerContext.useStoreActions((actions) => actions.status.setServerStatus);
    const { setInstance, setConnectionState } = ServerContext.useStoreActions((actions) => actions.socket);

    // Mirror the live connection state into refs so the one-shot visibility
    // listener below can read the latest values without re-registering.
    const connectedRef = useRef(connected);
    const instanceRef = useRef(instance);
    connectedRef.current = connected;
    instanceRef.current = instance;

    const updateToken = (uuid: string, socket: Websocket) => {
        if (updatingToken) {
            return;
        }

        updatingToken = true;
        getWebsocketToken(uuid)
            .then((data) => socket.setToken(data.token, true))
            .catch((error) => console.error(error))
            .then(() => {
                updatingToken = false;
            });
    };

    const connect = (uuid: string) => {
        const socket = new Websocket();

        socket.on('auth success', () => setConnectionState(true));
        socket.on('SOCKET_CLOSE', () => setConnectionState(false));
        socket.on('SOCKET_ERROR', () => {
            setError('connecting');
            setConnectionState(false);
        });
        socket.on('status', (status) => setServerStatus(status));

        socket.on('daemon error', (message) => {
            console.warn('Got error message from daemon socket:', message);
        });

        socket.on('token expiring', () => updateToken(uuid, socket));
        socket.on('token expired', () => updateToken(uuid, socket));
        socket.on('jwt error', (error: string) => {
            setConnectionState(false);
            console.warn('JWT validation error from wings:', error);

            if (reconnectErrors.find((v) => error.toLowerCase().indexOf(v) >= 0)) {
                updateToken(uuid, socket);
            } else {
                setError(
                    'There was an error validating the credentials provided for the websocket. Please refresh the page.',
                );
            }
        });

        socket.on('transfer status', (status: string) => {
            if (status === 'starting' || status === 'success') {
                return;
            }

            // This code forces a reconnection to the websocket which will connect us to the target node instead of the source node
            // in order to be able to receive transfer logs from the target node.
            socket.close();
            setError('connecting');
            setConnectionState(false);
            setInstance(null);
            connect(uuid);
        });

        getWebsocketToken(uuid)
            .then((data) => {
                // Connect and then set the authentication token.
                socket.setToken(data.token).connect(data.socket);

                // Once that is done, set the instance.
                setInstance(socket);
            })
            .catch((error) => console.error(error));
    };

    useEffect(() => {
        if (connected) setError('');
    }, [connected]);

    useEffect(() => {
        return () => {
            if (instance) instance.close();
        };
    }, [instance]);

    useEffect(() => {
        // If there is already an instance or there is no server, just exit out of this process
        // since we don't need to make a new connection.
        if (instance || !uuid) {
            return;
        }

        connect(uuid);
        // biome-ignore lint/correctness/useExhaustiveDependencies: connect is intentionally recreated
    }, [uuid, instance, connect]);

    useEffect(() => {
        // Mobile browsers suspend/kill the websocket when the tab is backgrounded
        // (e.g. the user returns to the home screen). Sockette's auto-reconnect
        // doesn't reliably resume in that case — its timers were frozen and a
        // clean close event may never fire — so the console is left empty until a
        // manual page reload. When the tab becomes visible again (or the network
        // comes back online), give pending close events a moment to settle, then
        // force a reconnect if we're no longer connected. On reconnect the socket
        // re-authenticates and the Console component re-requests SEND_LOGS, so the
        // buffer refills automatically.
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
        const attemptReconnect = () => {
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = window.setTimeout(() => {
                const socket = instanceRef.current;
                if (socket && !connectedRef.current) {
                    socket.reconnect();
                }
            }, 300);
        };
        const onVisibility = () => {
            if (document.visibilityState === 'visible') attemptReconnect();
        };

        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('online', attemptReconnect);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('online', attemptReconnect);
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, []);

    return error ? (
        <FadeTransition duration='duration-150' show>
            <div
                className={`flex items-center px-4 rounded-full fixed w-fit mx-auto left-0 right-0 top-4 bg-red-500 py-2 z-9999`}
            >
                {error === 'connecting' ? (
                    <>
                        <Spinner size={'small'} />
                        <p className={`ml-2 text-sm text-red-100`}>
                            We&apos;re having some trouble connecting to your server, please wait...
                        </p>
                    </>
                ) : (
                    <p className={`ml-2 text-sm text-white`}>{error}</p>
                )}
            </div>
        </FadeTransition>
    ) : null;
}

export default WebsocketHandler;
