import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
import { httpErrorToHuman } from '@/api/http';
import type { FileObject } from '@/api/server/files/loadDirectory';
import Can from '@/components/elements/Can';
import { Checkbox } from '@/components/elements/CheckboxNew';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { ServerError } from '@/components/elements/ScreenBlock';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import VirtualizedList from '@/components/elements/VirtualizedList';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import FileManagerStatus from '@/components/server/files/FileManagerStatus';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import UploadButton from '@/components/server/files/UploadButton';
import ServerHeader from '@/components/server/header/ServerHeader';
import { hashToPath } from '@/helpers';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { useStoreActions } from '@/state/hooks';
import { ServerContext } from '@/state/server';

import NewFileButton from './NewFileButton';

const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles: FileObject[] = [...files]
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1]?.name);
};

const FileManagerContainer = () => {
    const id = ServerContext.useStoreState((state) => state.server.data?.id);

    const { hash } = useLocation();
    const { data: files, error, mutate } = useFileManagerSwr();

    const _directory = ServerContext.useStoreState((state) => state.files.directory);
    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);

    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);

    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
        setDirectory(hashToPath(hash));
    }, [hash, setDirectory, clearFlashes, setSelectedFiles]);

    useEffect(() => {
        mutate();
    }, [mutate]);

    const onSelectAllClick = () => {
        setSelectedFiles(
            selectedFilesLength === (files?.length === 0 ? -1 : files?.length)
                ? []
                : files?.map((file) => file.name) || [],
        );
    };

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebouncedCallback((value: string) => setSearchTerm(value), 50);

    const normalizedSearchTerm = searchTerm.toLowerCase();
    const filesArray = useMemo(
        () => sortFiles(files ?? []).filter((file) => file.name.toLowerCase().includes(normalizedSearchTerm)),
        [files, normalizedSearchTerm],
    );

    useEffect(() => {
        setSearchTerm('');

        // Clean imput using a reference
        if (searchInputRef.current) {
            searchInputRef.current.value = '';
        }
    }, []);

    if (error) {
        return <ServerError title={'Something went wrong.'} message={httpErrorToHuman(error)} />;
    }

    return (
        <ServerContentBlock className='p-0!' title={'File Manager'} showFlashKey={'files'}>
            <div className='px-2 sm:px-14 pt-2 h-fit sm:pt-14'>
                <ErrorBoundary>
                    <ServerHeader />
                    <Can action={'file.create'}>
                        <div className='flex flex-row gap-1 pb-4'>
                            <FileManagerStatus />
                            <div className='gap-0'>
                                <NewDirectoryButton />
                                <NewFileButton id={id} />
                            </div>
                            <UploadButton />
                        </div>
                    </Can>
                    <div className={'flex flex-wrap-reverse md:flex-nowrap mb-4'}>
                        <FileManagerBreadcrumbs
                            renderLeft={
                                <Checkbox
                                    className='ml-[1.22rem] mr-4'
                                    checked={selectedFilesLength === (files?.length === 0 ? -1 : files?.length)}
                                    onCheckedChange={() => onSelectAllClick()}
                                />
                            }
                        />
                    </div>
                </ErrorBoundary>
            </div>
            {!files ? null : !files.length ? (
                <p className={`text-sm text-zinc-400 text-center`}>This folder is empty.</p>
            ) : (
                <>
                    <div className='relative p-1 border-[1px] border-[#ffffff12] rounded-md sm:ml-12 sm:mr-12 mx-2'>
                        <div className='absolute left-4 top-1/2 pl-2 -translate-y-1/2 pointer-events-none'>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                fill='none'
                                viewBox='0 0 24 24'
                                strokeWidth={1.5}
                                stroke='currentColor'
                                className='w-5 h-5 opacity-40'
                                aria-hidden='true'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
                                />
                            </svg>
                        </div>

                        <input
                            ref={searchInputRef}
                            className='pl-14 py-4 w-full rounded-lg bg-[#ffffff11] text-sm font-bold outline-none'
                            type='text'
                            placeholder='Search...'
                            onChange={(event) => debouncedSearchTerm(event.target.value)}
                        />
                    </div>
                    <div
                        data-hydrodactyl-file-manager-files
                        className='p-1 border-[1px] border-[#ffffff12] rounded-xl sm:ml-12 sm:mr-12 mx-2 bg-[radial-gradient(124.75%_124.75%_at_50.01%_-10.55%,_rgb(16,16,16)_0%,rgb(4,4,4)_100%)]'
                    >
                        <VirtualizedList
                            itemClassName=''
                            items={filesArray}
                            renderItem={(file) => <FileObjectRow file={file} />}
                            estimateSize={() => 54}
                            gap={2}
                        />
                    </div>
                    <MassActionsBar />
                </>
            )}
        </ServerContentBlock>
    );
};

export default FileManagerContainer;
