import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { type ITerminalOptions, Terminal } from '@xterm/xterm';
import { useSidebar } from '@/contexts/SidebarContext';
import '@xterm/xterm/css/xterm.css';
import './console.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import KeyboardShortcut from '@/components/ui/keyboard-shortcut';

import { cn } from '@/lib/utils';
import { usePermissions } from '@/plugins/usePermissions';
import { usePersistedState } from '@/plugins/usePersistedState';
import { ScrollDownHelperAddon } from '@/plugins/XtermScrollDownHelperAddon';
import { ServerContext } from '@/state/server';

const theme = {
    // background: 'rgba(0, 0, 0, 0)',
    background: '#110f0d',
    cursor: 'transparent',
    black: '#000000',
    red: '#E54B4B',
    green: '#9ECE58',
    yellow: '#FAED70',
    blue: '#396FE2',
    magenta: '#BB80B3',
    cyan: '#2DDAFD',
    white: '#d0d0d0',
    brightBlack: 'rgba(255, 255, 255, 0.2)',
    brightRed: '#FF5370',
    brightGreen: '#C3E88D',
    brightYellow: '#FFCB6B',
    brightBlue: '#82AAFF',
    brightMagenta: '#C792EA',
    brightCyan: '#89DDFF',
    brightWhite: '#ffffff',
    selection: '#FAF089',
};

const terminalProps: ITerminalOptions = {
    disableStdin: true,
    cursorStyle: 'underline',
    allowTransparency: true,
    fontSize: 12,
    fontFamily: 'monospace, monospace',
    // rows: 30,
    theme: theme,
};

const Console = () => {
    const TERMINAL_PRELUDE = '\u001b[1m\u001b[33mcontainer@hydrodactyl~ \u001b[0m';
    const ref = useRef<HTMLDivElement>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const terminal = useMemo(() => new Terminal({ ...terminalProps, rows: 30 }), []);
    const fitAddon = useMemo(() => new FitAddon(), []);
    const searchAddon = useMemo(() => new SearchAddon(), []);
    const webLinksAddon = useMemo(() => new WebLinksAddon(), []);
    const scrollDownHelperAddon = useMemo(() => new ScrollDownHelperAddon(), []);
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const [canSendCommands] = usePermissions(['control.console']);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data?.isTransferring);
    const [history, setHistory] = usePersistedState<string[]>(`${serverId}:command_history`, []);
    const [historyIndex, setHistoryIndex] = useState(-1);
    // Bumped when the tab becomes visible again so the listeners effect re-runs
    // (clear + SEND_LOGS) and refills a terminal left blank after backgrounding.
    const [visibilityTick, setVisibilityTick] = useState(0);
    const { isMinimized: _isMinimized } = useSidebar();
    const inputRef = useRef<HTMLInputElement>(null);

    const debouncedFit = useDebouncedCallback(() => {
        // FIXME: The proposeDimensions & fit functions seemingly only go one column at a time (until it stabilizes)
        // There's likely an underlying bug somewhere, but for now, here's a loop as a workaround
        if (terminal.element) {
            let lastCols = -1;
            let currentCols = 0;
            let iterations = 0;
            const maxIterations = 100;

            while (lastCols !== currentCols && iterations < maxIterations) {
                const proposedDimensions = fitAddon.proposeDimensions();
                if (!proposedDimensions) {
                    console.warn('Could not propose dimensions for terminal.');
                    return;
                }

                lastCols = currentCols;
                currentCols = proposedDimensions.cols;

                // console.log(`Iteration ${iterations + 1}: Proposed dimensions:`, proposedDimensions);

                terminal.resize(proposedDimensions.cols, proposedDimensions.rows);
                iterations++;
            }

            // if (iterations >= maxIterations) {
            //     console.warn(`Terminal resize reached maximum iterations (${maxIterations})`);
            // } else {
            //     console.log(`Terminal resize stabilized after ${iterations} iterations with cols: ${currentCols}`);
            // }
        }
    }, 200);

    const handleConsoleOutput = useCallback(
        (line: string, prelude = false) =>
            terminal.writeln(`${(prelude ? TERMINAL_PRELUDE : '') + line.replace(/(?:\r\n|\r|\n)$/im, '')}\u001b[0m`),
        [terminal],
    );

    const handleTransferStatus = useCallback(
        (status: string) => {
            switch (status) {
                // Sent by either the source or target node if a failure occurs.
                case 'failure':
                    terminal.writeln(`${TERMINAL_PRELUDE}Transfer has failed.\u001b[0m`);
                    return;
            }
        },
        [terminal],
    );

    const handleDaemonErrorOutput = useCallback(
        (line: string) =>
            terminal.writeln(`${TERMINAL_PRELUDE}\u001b[1m\u001b[41m${line.replace(/(?:\r\n|\r|\n)$/im, '')}\u001b[0m`),
        [terminal],
    );

    const handlePowerChangeEvent = useCallback(
        (state: string) => terminal.writeln(`${TERMINAL_PRELUDE}Server marked as ${state}...\u001b[0m`),
        [terminal],
    );

    const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            const newIndex = Math.min(historyIndex + 1, history?.length - 1);

            setHistoryIndex(newIndex);
            e.currentTarget.value = history?.[newIndex] || '';

            // By default up arrow will also bring the cursor to the start of the line,
            // so we'll preventDefault to keep it at the end.
            e.preventDefault();
        }

        if (e.key === 'ArrowDown') {
            const newIndex = Math.max(historyIndex - 1, -1);

            setHistoryIndex(newIndex);
            e.currentTarget.value = history?.[newIndex] || '';
        }

        const command = e.currentTarget.value;
        if (e.key === 'Enter' && command.length > 0) {
            setHistory((prevHistory) => [command, ...(prevHistory ?? [])].slice(0, 32));
            setHistoryIndex(-1);

            if (instance) instance.send('send command', command);
            e.currentTarget.value = '';
        }
    };

    const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
        // Focus input when slash key is pressed
        if (e.key === '/' && inputRef.current && document.activeElement !== inputRef.current) {
            e.preventDefault();
            inputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        // Add global keydown listener
        document.addEventListener('keydown', handleGlobalKeyDown);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && connected && instance) {
                terminal.clear();
                instance.send(SocketRequest.SEND_LOGS);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('keydown', handleGlobalKeyDown);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [handleGlobalKeyDown, connected, instance, terminal]);

    // Auto-focus input on component mount
    useEffect(() => {
        if (inputRef.current && canSendCommands) {
            inputRef.current.focus();
        }
    }, [canSendCommands]);

    useEffect(() => {
        if (connected && ref.current) {
            // If terminal is already attached to a different element, dispose it first
            if (terminal.element && terminal.element !== ref.current) {
                terminal.dispose();
            }

            // Only set up the terminal if it's not already attached to the current element
            if (!terminal.element || terminal.element !== ref.current) {
                terminal.loadAddon(fitAddon);
                terminal.loadAddon(searchAddon);
                terminal.loadAddon(webLinksAddon);
                terminal.loadAddon(scrollDownHelperAddon);

                terminal.open(ref.current);
                fitAddon.fit();

                // Lock the terminal canvas. The hidden `.xterm-helper-textarea` is
                // xterm's only keyboard entry point — disabling it (and dropping it
                // from the tab order) means the canvas can never gain focus and no
                // keystrokes reach xterm's input pipeline, so nothing (scroll-on-key,
                // the copy handler below, IME, etc.) ever fires. This is on top of
                // `disableStdin`, which only suppresses emitted data. Output rendering,
                // mouse text-selection, and native viewport scrolling are unaffected;
                // command input still flows through the dedicated box below.
                if (terminal.textarea) {
                    terminal.textarea.tabIndex = -1;
                    terminal.textarea.disabled = true;
                }

                // Add support for capturing keys
                terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                        document.execCommand('copy');
                        return false;
                    }
                    // } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                    //     e.preventDefault();
                    //     searchBar.show();
                    //     return false;
                    // } else if (e.key === 'Escape') {
                    //     searchBar.hidden();
                    // }
                    return true;
                });

                // Set up ResizeObserver to watch for container size changes
                resizeObserverRef.current = new ResizeObserver(debouncedFit);

                if (ref.current) {
                    resizeObserverRef.current.observe(ref.current);
                }
            }
        }

        // Cleanup function to dispose terminal when component unmounts
        return () => {
            if (terminal.element) {
                terminal.dispose();
            }
            // Clean up the ResizeObserver
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }
        };
    }, [terminal, connected, fitAddon, searchAddon, webLinksAddon, scrollDownHelperAddon, debouncedFit]);

    // useEventListener(
    //     'resize',
    //     debounce(() => {
    //         if (terminal.element) {
    //             fitAddon.fit();
    //         }
    //     }, 100),
    // );

    useEffect(() => {
        debouncedFit();
    }, [debouncedFit]);

    // visibilityTick is an intentional trigger dep: it isn't read in the body, it
    // only forces this effect to re-run (clear + SEND_LOGS) when the tab becomes
    // visible again, so a terminal left blank after backgrounding refills.
    // biome-ignore lint/correctness/useExhaustiveDependencies: visibilityTick is a deliberate re-run trigger
    useEffect(() => {
        const listeners: Record<string, (s: string) => void> = {
            [SocketEvent.STATUS]: handlePowerChangeEvent,
            [SocketEvent.CONSOLE_OUTPUT]: handleConsoleOutput,
            [SocketEvent.INSTALL_OUTPUT]: handleConsoleOutput,
            [SocketEvent.TRANSFER_LOGS]: handleConsoleOutput,
            [SocketEvent.TRANSFER_STATUS]: handleTransferStatus,
            [SocketEvent.DAEMON_MESSAGE]: (line) => handleConsoleOutput(line, true),
            [SocketEvent.DAEMON_ERROR]: handleDaemonErrorOutput,
        };

        if (connected && instance) {
            // Do not clear the console if the server is being transferred.
            if (!isTransferring) {
                terminal.clear();
            }

            Object.keys(listeners).forEach((key: string) => {
                const listener = listeners[key];
                if (listener === undefined) {
                    return;
                }

                instance.addListener(key, listener);
            });
            instance.send(SocketRequest.SEND_LOGS);
        }

        return () => {
            if (instance) {
                Object.keys(listeners).forEach((key: string) => {
                    const listener = listeners[key];
                    if (listener === undefined) {
                        return;
                    }

                    instance.removeListener(key, listener);
                });
            }
        };
    }, [
        connected,
        instance,
        isTransferring,
        terminal,
        handleConsoleOutput,
        handleDaemonErrorOutput,
        handlePowerChangeEvent,
        handleTransferStatus,
        visibilityTick,
    ]);

    // On phones, backgrounding the app (home screen) freezes this component, so
    // when the user returns the socket is often still/again connected (stats keep
    // flowing) but the terminal can be left blank — its effects never re-ran while
    // frozen. Bumping visibilityTick on return re-runs the listeners effect above
    // (clear + SEND_LOGS), repopulating the console instead of leaving it empty.
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                setVisibilityTick((tick) => tick + 1);
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    return (
        <div className='flex w-full h-full'>
            <div className={cn('relative flex size-full flex-col overflow-x-hidden contain-inline-size flex-1')}>
                <SpinnerOverlay visible={!connected} size={'large'} />
                <div
                    className={cn(
                        // `console-terminal-host` decouples the terminal's scroll from the
                        // page (see console.css): on touch devices the canvas lets touches
                        // fall through to .xterm-viewport so the COMPOSITOR scrolls the
                        // buffer natively (GPU-smooth, not xterm's main-thread handler that
                        // stutters on phones), and overscroll-behavior:contain keeps it from
                        // chaining to the page. Desktop (mouse) is untouched. This is the
                        // "separate the xterm console from the console page" behaviour.
                        'console-terminal-host bg-bg-raised border-mocha-400 p-4 flex min-h-[260px] lg:flex-1 lg:min-h-0 flex-col overflow-hidden rounded-t-2xl border text-sm',
                        canSendCommands ? 'rounded-b-none border-b-0' : 'rounded-b-2xl',
                    )}
                >
                    <div className='h-full' ref={ref} />
                </div>

                {canSendCommands && (
                    <div className='w-full shrink-0 rounded-b-2xl rounded-t-none border border-t-0 border-mocha-300 bg-mocha-400 p-2 text-zinc-100 flex px-(--padding-x) relative [--padding-x:--spacing(4)] text-sm'>
                        <input
                            ref={inputRef}
                            className='w-full'
                            type={'text'}
                            placeholder={'Enter a command'}
                            aria-label={'Console command input.'}
                            disabled={!instance || !connected}
                            onKeyDown={handleCommandKeyDown}
                            autoCorrect={'off'}
                            autoCapitalize={'none'}
                        />
                        <KeyboardShortcut keys={['/']} variant='faded' className='pl-(--padding-x)' />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Console;
