import { ArrowUpFromLine, ChevronDown, FolderOpen } from '@gravity-ui/icons';
import axios from 'axios';
import { join } from 'pathe';
import { useEffect, useRef, useState } from 'react';
import createDirectory from '@/api/server/files/createDirectory';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import { ModalMask } from '@/components/elements/Modal';
import FadeTransition from '@/components/elements/transitions/FadeTransition';
import { Button } from '@/components/ui/button';
import { cleanDirectoryPath } from '@/helpers';
import { useTranslation } from '@/i18n/I18nProvider';
import useEventListener from '@/plugins/useEventListener';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import {
    CHUNK_THRESHOLD_BYTES,
    CHUNKS_PER_FILE,
    ChunkedUploadUnsupportedError,
    GLOBAL_CONNECTION_BUDGET,
    MAX_CONCURRENT_LARGE_FILES,
    uploadFileChunked,
    uploadFileMultipart,
} from './chunkedUpload';
import {
    type CollectedUpload,
    collectFromEntries,
    collectFromFileList,
    getEmptyDirectories,
    getFileSystemEntries,
    getRelativeDirectory,
    type UploadCandidate,
} from './uploadDirectory';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

const fileUploadShortcut = isMac ? '⌘O' : 'Ctrl+O';
const folderUploadShortcut = isMac ? '⇧⌘O' : 'Ctrl+Shift+O';

function isFileOrDirectory(event: DragEvent): boolean {
    if (!event.dataTransfer?.types) {
        return false;
    }

    return event.dataTransfer.types.some((value) => value.toLowerCase() === 'files');
}

/**
 * Schedules uploads under a global HTTP connection budget:
 * - small files: 1 connection each
 * - large files: up to CHUNKS_PER_FILE connections, max MAX_CONCURRENT_LARGE_FILES at once
 */
const runUploadScheduler = async (
    items: {
        connections: number;
        large: boolean;
        run: (slots: number) => Promise<void>;
    }[],
): Promise<void> => {
    let available = GLOBAL_CONNECTION_BUDGET;
    let activeLarge = 0;
    let failed: unknown;
    let cursor = 0;
    const waiters: Array<() => void> = [];

    const notify = () => {
        const pending = waiters.splice(0);
        for (const wake of pending) {
            wake();
        }
    };

    const acquire = async (want: number, large: boolean): Promise<number> => {
        for (;;) {
            if (failed) {
                throw failed;
            }
            const largeOk = !large || activeLarge < MAX_CONCURRENT_LARGE_FILES;
            const slots = Math.min(want, available);
            if (largeOk && slots > 0) {
                available -= slots;
                if (large) {
                    activeLarge += 1;
                }
                return slots;
            }
            await new Promise<void>((resolve) => waiters.push(resolve));
        }
    };

    const release = (slots: number, large: boolean) => {
        available += slots;
        if (large) {
            activeLarge -= 1;
        }
        notify();
    };

    const workers = Array.from({ length: Math.min(items.length, GLOBAL_CONNECTION_BUDGET) }, async () => {
        while (!failed) {
            const index = cursor++;
            if (index >= items.length) {
                return;
            }
            const item = items[index];
            if (!item) {
                return;
            }

            let slots = 0;
            try {
                slots = await acquire(item.connections, item.large);
                await item.run(slots);
            } catch (error) {
                failed = error;
                notify();
                throw error;
            } finally {
                if (slots > 0) {
                    release(slots, item.large);
                }
            }
        }
    });

    await Promise.all(workers);
    if (failed) {
        throw failed;
    }
};

const UploadButton = () => {
    const { t } = useTranslation();
    const fileUploadInput = useRef<HTMLInputElement>(null);
    const folderUploadInput = useRef<HTMLInputElement>(null);
    const [visible, setVisible] = useState(false);
    const { mutate } = useFileManagerSwr();
    const { clearAndAddHttpError } = useFlashKey('files');

    const name = ServerContext.useStoreState((state) => state.server.data?.name);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { clearFileUploads, removeFileUpload, pushFileUpload, setUploadProgress } = ServerContext.useStoreActions(
        (actions) => actions.files,
    );

    useEffect(() => {
        if (folderUploadInput.current) {
            folderUploadInput.current.setAttribute('webkitdirectory', '');
            folderUploadInput.current.setAttribute('directory', '');
        }
    }, []);

    useEventListener(
        'dragenter',
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isFileOrDirectory(e as DragEvent)) {
                return setVisible(true);
            }
        },
        { capture: true },
    );

    useEventListener('dragexit', () => setVisible(false), { capture: true });

    useEventListener('keydown', (e) => {
        const event = e as KeyboardEvent;

        if (visible) {
            setVisible(false);
        }

        if (!(event.ctrlKey || event.metaKey) || event.altKey || event.key.toLowerCase() !== 'o') {
            return;
        }

        const target = event.target as HTMLElement | null;
        if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) {
            return;
        }

        event.preventDefault();
        (event.shiftKey ? folderUploadInput : fileUploadInput).current?.click();
    });

    const uploadCandidate = async (
        serverUuid: string,
        candidate: UploadCandidate,
        controller: AbortController,
        connectionSlots: number,
    ) => {
        const targetDirectory = cleanDirectoryPath(join(directory, getRelativeDirectory(candidate.relativePath)));
        const onProgress = (loaded: number) => setUploadProgress({ name: candidate.relativePath, loaded });

        const tryChunked = candidate.file.size >= CHUNK_THRESHOLD_BYTES;
        if (tryChunked) {
            const signedUrl = await getFileUploadUrl(serverUuid);
            try {
                await uploadFileChunked({
                    signedUploadUrl: signedUrl,
                    file: candidate.file,
                    directory: targetDirectory,
                    signal: controller.signal,
                    onProgress,
                    connectionSlots,
                });
                return;
            } catch (error) {
                if (!(error instanceof ChunkedUploadUnsupportedError)) {
                    throw error;
                }
                // Fall through to multipart with a fresh signed URL.
            }
        }

        const signedUrl = await getFileUploadUrl(serverUuid);
        await uploadFileMultipart({
            signedUploadUrl: signedUrl,
            file: candidate.file,
            directory: targetDirectory,
            signal: controller.signal,
            onProgress,
        });
    };

    const onFileSubmission = (collected: CollectedUpload) => {
        clearAndAddHttpError();

        if (!uuid || (collected.files.length === 0 && collected.directories.length === 0)) {
            return;
        }

        const serverUuid = uuid;
        const items: {
            connections: number;
            large: boolean;
            run: (slots: number) => Promise<void>;
        }[] = [];

        for (const relativeDirectory of getEmptyDirectories(collected)) {
            items.push({
                connections: 1,
                large: false,
                run: async () => {
                    await createDirectory(serverUuid, directory, relativeDirectory);
                },
            });
        }

        for (const candidate of collected.files) {
            const controller = new AbortController();
            pushFileUpload({
                name: candidate.relativePath,
                data: { abort: controller, loaded: 0, total: candidate.file.size },
            });

            const large = candidate.file.size >= CHUNK_THRESHOLD_BYTES;
            items.push({
                connections: large ? CHUNKS_PER_FILE : 1,
                large,
                run: async (slots) => {
                    await uploadCandidate(serverUuid, candidate, controller, slots);
                    removeFileUpload(candidate.relativePath);
                },
            });
        }

        void runUploadScheduler(items)
            .then(() => mutate())
            .catch((error) => {
                clearFileUploads();

                if (!axios.isCancel(error)) {
                    clearAndAddHttpError(error);
                }
            });
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setVisible(false);

        const entries = e.dataTransfer?.items ? getFileSystemEntries(e.dataTransfer.items) : [];
        if (entries.length > 0) {
            void collectFromEntries(entries).then(onFileSubmission).catch(clearAndAddHttpError);

            return;
        }

        if (e.dataTransfer?.files?.length) {
            onFileSubmission(collectFromFileList(e.dataTransfer.files));
        }
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.currentTarget.files) {
            onFileSubmission(collectFromFileList(e.currentTarget.files));
        }

        e.currentTarget.value = '';
    };

    return (
        <>
            <FadeTransition show={visible} duration='duration-75' key='upload_modal_mask' appear unmount>
                <ModalMask
                    className='flex'
                    onClick={() => setVisible(false)}
                    onDragOver={(e) => e.preventDefault()}
                    onDragLeave={() => setVisible(false)}
                    onDrop={onDrop}
                >
                    <div className={'w-full flex items-center justify-center pointer-events-none'}>
                        <div
                            className={
                                'relative flex flex-col items-center gap-4 bg-brand w-full rounded-2xl py-12 px-4 mx-10 max-w-sm'
                            }
                        >
                            <div className='absolute inset-4 border-dashed border-[#ffffff88] border-2 rounded-xl'></div>
                            <svg
                                width='24'
                                height='24'
                                viewBox='0 0 24 24'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                                className='w-8 h-8'
                                aria-hidden='true'
                            >
                                <path
                                    d='M16.2812 1.25C17.5268 1.24996 18.5627 1.24993 19.3845 1.36163C20.2516 1.47949 21.0278 1.73812 21.6498 2.36687C22.2702 2.9941 22.524 3.77443 22.6399 4.64582C22.7501 5.47443 22.75 6.51982 22.75 7.78076V10.7193C22.75 11.9802 22.7501 13.0256 22.6399 13.8542C22.524 14.7256 22.2702 15.5059 21.6498 16.1331C21.0278 16.7619 20.2516 17.0205 19.3845 17.1384C18.5627 17.2501 17.5268 17.25 16.2812 17.25L15.2876 17.25C14.7353 17.25 14.2876 16.8023 14.2876 16.25C14.2876 15.6977 14.7353 15.25 15.2876 15.25H16.2108C17.545 15.25 18.4439 15.2478 19.1151 15.1566C19.7564 15.0694 20.0386 14.918 20.2278 14.7267C20.4186 14.5338 20.5704 14.2441 20.6573 13.5905C20.7479 12.9093 20.75 11.9979 20.75 10.65V7.85C20.75 6.5021 20.7479 5.59069 20.6573 4.90947C20.5704 4.2559 20.4186 3.96621 20.2278 3.77334C20.0386 3.58198 19.7564 3.43057 19.1151 3.34341C18.4439 3.25217 17.545 3.25 16.2108 3.25H15.2876C13.9534 3.25 13.0545 3.25217 12.3833 3.34341C12.2051 3.36763 12.1496 3.58343 12.285 3.70185L14.9085 5.99743C15.263 6.30758 15.3458 6.81271 15.1369 7.21248C15.0964 7.2899 15.0762 7.32861 15.0131 7.3711C14.9501 7.41358 14.8886 7.41953 14.7656 7.43142L9.74449 7.91666C9.19222 7.91361 8.74697 7.46344 8.75002 6.91116C8.75496 6.01395 8.77445 5.23439 8.86797 4.57713C8.96274 3.91111 9.14328 3.29001 9.52575 2.75108C9.62278 2.61437 9.73032 2.48648 9.84864 2.36687C10.4706 1.73812 11.2468 1.47949 12.1139 1.36163C12.9357 1.24993 13.9716 1.24996 15.2172 1.25H16.2812Z'
                                    fill='white'
                                />
                                <path
                                    fillRule='evenodd'
                                    clipRule='evenodd'
                                    d='M9.59334 5.25H9.59333H9.59332H8.40669H8.40667H8.40666C6.93025 5.24998 5.74683 5.24997 4.81751 5.37372C3.85586 5.50178 3.05447 5.77447 2.41849 6.4044C1.78151 7.03531 1.50485 7.83196 1.3751 8.78785C1.24997 9.70973 1.24998 10.8831 1.25 12.3443V12.3443V12.3443V15.6557V15.6557V15.6557C1.24998 17.1169 1.24997 18.2903 1.3751 19.2122C1.50485 20.168 1.78151 20.9647 2.41849 21.5956C3.05447 22.2255 3.85586 22.4982 4.81751 22.6263C5.74682 22.75 6.93025 22.75 8.40666 22.75H9.59335C11.0698 22.75 12.2532 22.75 13.1825 22.6263C14.1441 22.4982 14.9455 22.2255 15.5815 21.5956C16.2185 20.9647 16.4952 20.168 16.6249 19.2122C16.75 18.2903 16.75 17.1169 16.75 15.6557V12.3443C16.75 10.8831 16.75 9.70973 16.6249 8.78785C16.4952 7.83196 16.2185 7.03531 15.5815 6.4044C14.9455 5.77447 14.1441 5.50178 13.1825 5.37372C12.2532 5.24997 11.0698 5.24998 9.59334 5.25ZM6 11C5.44772 11 5 11.4477 5 12C5 12.5523 5.44772 13 6 13H9C9.55229 13 10 12.5523 10 12C10 11.4477 9.55229 11 9 11H6ZM6 16C5.44772 16 5 16.4477 5 17C5 17.5523 5.44772 18 6 18H11C11.5523 18 12 17.5523 12 17C12 16.4477 11.5523 16 11 16H6Z'
                                    fill='white'
                                />
                            </svg>
                            <h1
                                className={
                                    'flex-1 text-lg font-bold tracking-tight text-center truncate w-full relative px-4'
                                }
                            >
                                {t('server.files.upload_to', { name: name ?? '' })}
                            </h1>
                        </div>
                    </div>
                </ModalMask>
            </FadeTransition>
            <input type='file' ref={fileUploadInput} className={'hidden'} onChange={onInputChange} multiple />
            <input type='file' ref={folderUploadInput} className={'hidden'} onChange={onInputChange} multiple />
            <div className='inline-flex'>
                <Button
                    variant='secondary'
                    className='gap-2 rounded-r-none border-r-0'
                    onClick={() => fileUploadInput.current?.click()}
                    title={t('server.files.upload_files_to', { directory })}
                >
                    <ArrowUpFromLine width={16} height={16} fill='currentColor' />
                    {t('common.upload')}
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant='secondary'
                            className='rounded-l-none px-2'
                            aria-label={t('server.files.more_upload_options')}
                            title={t('server.files.more_upload_options')}
                        >
                            <ChevronDown width={16} height={16} fill='currentColor' />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='start' sideOffset={8} className='min-w-[13rem]'>
                        <DropdownMenuLabel className='text-xs font-normal text-neutral-400'>
                            {t('server.files.upload_to', { name: directory })}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className='gap-2' onSelect={() => fileUploadInput.current?.click()}>
                            <ArrowUpFromLine width={16} height={16} fill='currentColor' />
                            {t('server.files.upload_files')}
                            <DropdownMenuShortcut>{fileUploadShortcut}</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem className='gap-2' onSelect={() => folderUploadInput.current?.click()}>
                            <FolderOpen width={16} height={16} fill='currentColor' />
                            {t('server.files.upload_folder')}
                            <DropdownMenuShortcut>{folderUploadShortcut}</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    );
};

export default UploadButton;
