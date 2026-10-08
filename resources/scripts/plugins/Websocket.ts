import { EventEmitter } from 'events';

/**
 * Manages a single connection to the daemon websocket.
 *
 * The previous implementation layered a manual reconnect timer on top of
 * Sockette's own reconnect handling, which produced two competing reconnect
 * paths:
 *
 *  - Sockets were torn down while still connecting, producing the
 *    "WebSocket is closed before the connection is established" warning.
 *  - `auth` was sent from `onreconnect`, which Sockette fires *before* it
 *    creates the replacement socket, so the token was written to a dead or
 *    CONNECTING socket ("Still in CONNECTING state").
 *  - Sockette deliberately does not reconnect on clean closes (codes 1000,
 *    1001 and 1005), and the manual timer was cleared on open and never
 *    rescheduled — so a socket the daemon closed while idle stayed dead until
 *    the page was reloaded, leaving the console blank.
 *
 * This implementation owns the socket directly: it reconnects on every close
 * with exponential backoff, only ever writes while the socket is OPEN, and
 * reports a connection state derived from the socket's real readyState.
 */
export class Websocket extends EventEmitter {
    // The socket instance being tracked.
    private socket: WebSocket | null = null;

    // Timer for a pending reconnect.
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    // The current backoff for reconnects, in milliseconds.
    private backoff = 1000;

    private readonly maxBackoff = 20000;

    // The URL being connected to for the socket.
    private url: string | null = null;

    // The authentication token passed along with every request to the Daemon.
    // By default this token expires every 15 minutes and must therefore be
    // refreshed at a pretty continuous interval. The socket server will respond
    // with "token expiring" and "token expired" events when approaching 3 minutes
    // and 0 minutes to expiry.
    private token = '';

    // Whether close() was called on purpose (router/state teardown). Stops the
    // close handler from scheduling a reconnect.
    private closedIntentionally = false;

    // Connects to the websocket instance and sets the token for the initial request.
    connect(url: string): this {
        this.url = url;
        this.closedIntentionally = false;
        this.backoff = 1000;
        this.openSocket();

        return this;
    }

    private openSocket(): void {
        if (!this.url || this.closedIntentionally) {
            return;
        }

        this.clearReconnectTimer();

        let socket: WebSocket;
        try {
            socket = new WebSocket(this.url);
        } catch {
            this.scheduleReconnect();

            return;
        }

        this.socket = socket;

        socket.onopen = () => {
            if (this.socket !== socket) {
                return;
            }

            this.backoff = 1000;
            this.emit('SOCKET_OPEN');
            this.authenticate();
        };

        socket.onmessage = (e) => {
            if (this.socket !== socket) {
                return;
            }

            try {
                const { event, args } = JSON.parse(e.data);
                if (args) {
                    this.emit(event, ...args);
                } else {
                    this.emit(event);
                }
            } catch (ex) {
                console.warn('Failed to parse incoming websocket message.', ex);
            }
        };

        socket.onclose = () => {
            if (this.socket === socket) {
                this.socket = null;
            }

            this.emit('SOCKET_CLOSE');
            this.scheduleReconnect();
        };

        socket.onerror = (error) => {
            this.emit('SOCKET_ERROR', error);
        };
    }

    private scheduleReconnect(): void {
        if (this.closedIntentionally || !this.url || this.reconnectTimer) {
            return;
        }

        this.emit('SOCKET_RECONNECT');

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.openSocket();
        }, this.backoff);

        this.backoff = Math.min(this.backoff + 2500, this.maxBackoff);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    // Sets the authentication token to use when sending commands back and forth
    // between the websocket instance.
    setToken(token: string, isUpdate = false): this {
        this.token = token;

        if (isUpdate) {
            this.authenticate();
        }

        return this;
    }

    authenticate(): void {
        if (this.url && this.token) {
            this.send('auth', this.token);
        }
    }

    close(code?: number, reason?: string): void {
        this.closedIntentionally = true;
        this.url = null;
        this.token = '';
        this.clearReconnectTimer();

        const socket = this.socket;
        this.socket = null;

        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            try {
                socket.close(code, reason);
            } catch {
                // The socket is already gone; nothing to do.
            }
        }
    }

    /**
     * Force a fresh connection. Used when the tab becomes visible again or the
     * network returns, where the socket may have been killed without a clean
     * close event (mobile tabs are frozen and dropped silently).
     */
    reconnect(): void {
        this.clearReconnectTimer();
        this.backoff = 1000;

        // A connection attempt is already in flight; leave it alone.
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
            return;
        }

        const socket = this.socket;
        this.socket = null;

        if (socket && socket.readyState === WebSocket.OPEN) {
            try {
                socket.close();
            } catch {
                // The socket is already gone; nothing to do.
            }
        }

        this.openSocket();
    }

    // Whether the socket is actually open right now, derived from readyState
    // rather than a flag that can go stale when a socket is dropped silently.
    isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }

    send(event: string, payload?: string | string[]) {
        // Never write to a socket that is still connecting or already closed;
        // doing so throws InvalidStateError and spams the browser console.
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        this.socket.send(
            JSON.stringify({
                event,
                args: Array.isArray(payload) ? payload : [payload],
            }),
        );
    }
}
