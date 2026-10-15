import { useEffect, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import { useDebouncedCallback } from 'use-debounce';
import { httpErrorToHuman } from '@/api/http';
import type { Server } from '@/api/server/getServer';
import processStartupCommand from '@/api/server/processStartupCommand';
import resetStartupCommand from '@/api/server/resetStartupCommand';
import revertDockerImage from '@/api/server/revertDockerImage';
import setSelectedDockerImage from '@/api/server/setSelectedDockerImage';
import updateStartupCommand from '@/api/server/updateStartupCommand';
import getServerStartup from '@/api/swr/getServerStartup';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Dropdown from '@/components/elements/Dropdown';
import { Dialog } from '@/components/elements/dialog';
import InputSpinner from '@/components/elements/InputSpinner';
import { ServerError } from '@/components/elements/ScreenBlock';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import ServerHeader from '@/components/server/header/ServerHeader';
import VariableBox from '@/components/server/startup/VariableBox';
import { Button } from '@/components/ui/button';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import useFlash from '@/plugins/useFlash';
import { usePermissions } from '@/plugins/usePermissions';
import { ServerContext } from '@/state/server';

const commandClass =
    'w-full font-mono text-sm text-zinc-200 break-all whitespace-pre-wrap rounded-xl border border-[#ffffff10] bg-[#ffffff08] px-4 py-3';

const StartupContainer = () => {
    const [loading, setLoading] = useState(false);
    const [commandLoading, setCommandLoading] = useState(false);
    const [editingCommand, setEditingCommand] = useState(false);
    const [commandValue, setCommandValue] = useState('');
    const [liveProcessedCommand, setLiveProcessedCommand] = useState('');
    const [revertModalVisible, setRevertModalVisible] = useState(false);
    const commandRequestId = useRef(0);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [canEditDockerImage] = usePermissions(['startup.docker-image']);

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const server = ServerContext.useStoreState((state) => state.server.data as Server, isEqual);
    const variables = ServerContext.useStoreState(
        ({ server }) => ({
            variables: server.data?.variables,
            invocation: server.data?.invocation,
            dockerImage: server.data?.dockerImage,
        }),
        isEqual,
    );

    const { data, error, isValidating, mutate } = getServerStartup(uuid, {
        ...variables,
        dockerImages: { [variables.dockerImage]: variables.dockerImage },
        rawStartupCommand: '',
    });

    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    const isCustomImage =
        data &&
        !Object.values(data.dockerImages)
            .map((v) => v.toLowerCase())
            .includes(variables.dockerImage.toLowerCase());

    useEffect(() => {
        mutate();
    }, [mutate]);

    useDeepCompareEffect(() => {
        if (!data) return;

        setServerFromState((s) => ({
            ...s,
            invocation: data.invocation,
            variables: data.variables,
        }));
    }, [data]);

    const updateSelectedDockerImage = (image: string) => {
        setLoading(true);
        clearFlashes('startup:image');

        setSelectedDockerImage(uuid, image)
            .then(() => setServerFromState((s) => ({ ...s, dockerImage: image })))
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'startup:image', error });
            })
            .then(() => setLoading(false));
    };

    const revertToEggDefault = () => {
        setLoading(true);
        clearFlashes('startup:image');

        revertDockerImage(uuid)
            .then(() => {
                // Get the first docker image from the egg as the default
                const defaultImage = data ? Object.values(data.dockerImages)[0] || '' : '';
                setServerFromState((s) => ({ ...s, dockerImage: defaultImage }));
                setRevertModalVisible(false);
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'startup:image', error });
            })
            .then(() => setLoading(false));
    };

    const updateCommand = () => {
        setCommandLoading(true);
        clearFlashes('startup:command');

        updateStartupCommand(uuid, commandValue)
            .then((invocation) => {
                mutate(
                    (data) => ({
                        ...(data ?? {}),
                        invocation,
                        rawStartupCommand: commandValue,
                    }),
                    false,
                );
                setEditingCommand(false);
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'startup:command', error });
            })
            .then(() => setCommandLoading(false));
    };

    const loadDefaultCommand = async () => {
        try {
            const defaultCommand = await resetStartupCommand(uuid);
            setCommandValue(defaultCommand);
            const processed = await processCommandLive(defaultCommand);
            setLiveProcessedCommand(processed);
        } catch (error) {
            console.error('Failed to load default command:', error);
        }
    };

    const processCommandLive = async (rawCommand: string): Promise<string> => {
        try {
            return await processStartupCommand(uuid, rawCommand);
        } catch (error) {
            console.error('Failed to process command:', error);
            return rawCommand;
        }
    };

    const debouncedProcessCommand = useDebouncedCallback(async (value: string) => {
        const requestId = ++commandRequestId.current;
        const processed = await processCommandLive(value);
        if (requestId === commandRequestId.current) {
            setLiveProcessedCommand(processed);
        }
    }, 300);

    const startEditingCommand = async () => {
        const initialCommand = data?.rawStartupCommand || '';
        setCommandValue(initialCommand);
        const processed = await processCommandLive(initialCommand);
        setLiveProcessedCommand(processed);
        setEditingCommand(true);
    };

    const cancelEditingCommand = () => {
        setEditingCommand(false);
        setCommandValue('');
        setLiveProcessedCommand('');
    };

    const handleCommandChange = (value: string) => {
        setCommandValue(value);
        debouncedProcessCommand(value);
    };

    const imageLabel =
        (data && Object.keys(data.dockerImages).find((key) => data.dockerImages[key] === variables.dockerImage)) ||
        variables.dockerImage;

    const builtinVariables = [
        { name: 'SERVER_MEMORY', value: server?.limits?.memory || 'null' },
        { name: 'SERVER_IP', value: server?.allocations?.find((a) => a.isDefault)?.ip || 'null' },
        { name: 'SERVER_PORT', value: server?.allocations?.find((a) => a.isDefault)?.port || 'null' },
        { name: 'SERVER_UUID', value: uuid },
        { name: 'SERVER_NAME', value: server?.name || 'null' },
        { name: 'SERVER_CPU', value: server?.limits?.cpu || 'null' },
    ];

    return !data ? (
        !error || (error && isValidating) ? (
            <div className='flex items-center justify-center py-24'>
                <div className='flex flex-col items-center gap-3'>
                    <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-brand' />
                    <p className='text-sm text-neutral-400'>Loading startup configuration...</p>
                </div>
            </div>
        ) : (
            <ServerError title={'Oops!'} message={httpErrorToHuman(error)} />
        )
    ) : (
        <ServerContentBlock title={'Startup Settings'} showFlashKey={'startup:image'} className='p-0!'>
            <ServerHeader />
            <Dialog.Confirm
                open={revertModalVisible}
                title={'Revert Docker Image'}
                confirm={'Yes, revert to default'}
                onClose={() => setRevertModalVisible(false)}
                onConfirmed={revertToEggDefault}
                loading={loading}
            >
                <div className='space-y-3'>
                    <p>
                        This will revert your server&apos;s Docker image back to the egg&apos;s default specification.
                    </p>
                    <p className='text-sm text-amber-200'>
                        You will not be able to set a custom image again without contacting support.
                    </p>
                    <p className='text-sm text-neutral-400'>Are you sure you want to continue?</p>
                </div>
            </Dialog.Confirm>

            <div className='flex flex-col gap-12 px-4 py-8 sm:px-14 sm:py-14'>
                <section className='flex flex-col gap-4'>
                    <div className='flex items-start justify-between gap-4'>
                        <div>
                            <h2 className='text-sm font-medium text-zinc-100'>Startup command</h2>
                            <p className='mt-1 text-sm text-zinc-400'>
                                The command used to start this server. Variables are filled in before it runs. Click a
                                command to copy it.
                            </p>
                        </div>
                        {!editingCommand && (
                            <Button variant='secondary' className='shrink-0' onClick={startEditingCommand}>
                                Edit command
                            </Button>
                        )}
                    </div>

                    {editingCommand ? (
                        <div className='flex flex-col gap-4'>
                            <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
                                <div>
                                    <label htmlFor='raw_command' className='mb-1.5 block text-xs text-zinc-500'>
                                        Raw command
                                    </label>
                                    <textarea
                                        id='raw_command'
                                        className={`${commandClass} h-40 resize-none focus:border-[#ffffff20] focus:outline-none`}
                                        value={commandValue}
                                        onChange={(e) => handleCommandChange(e.target.value)}
                                        placeholder='{{SERVER_MEMORY}}, {{SERVER_PORT}}, …'
                                    />
                                </div>
                                <div>
                                    <span className='mb-1.5 block text-xs text-zinc-500'>Preview</span>
                                    <CopyOnClick text={liveProcessedCommand}>
                                        <div className={`${commandClass} min-h-40 cursor-pointer text-zinc-300`}>
                                            {liveProcessedCommand || 'The resolved command shows up here.'}
                                        </div>
                                    </CopyOnClick>
                                </div>
                            </div>
                            <div className='flex flex-col gap-2 sm:flex-row'>
                                <InputSpinner visible={commandLoading}>
                                    <Button
                                        variant='secondary'
                                        onClick={updateCommand}
                                        disabled={commandLoading || !commandValue.trim()}
                                    >
                                        {commandLoading && <Spinner size='small' />}
                                        {commandLoading ? 'Saving...' : 'Save'}
                                    </Button>
                                </InputSpinner>
                                <Button variant='outline' onClick={loadDefaultCommand} disabled={commandLoading}>
                                    Load default
                                </Button>
                                <Button variant='ghost' onClick={cancelEditingCommand} disabled={commandLoading}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className='flex flex-col gap-4'>
                            {data.rawStartupCommand && (
                                <div>
                                    <span className='mb-1.5 block text-xs text-zinc-500'>Raw</span>
                                    <CopyOnClick text={data.rawStartupCommand}>
                                        <div className={`${commandClass} cursor-pointer hover:border-[#ffffff20]`}>
                                            {data.rawStartupCommand}
                                        </div>
                                    </CopyOnClick>
                                </div>
                            )}
                            <div>
                                <span className='mb-1.5 block text-xs text-zinc-500'>Processed</span>
                                <CopyOnClick text={data.invocation}>
                                    <div
                                        className={`${commandClass} cursor-pointer bg-transparent text-zinc-400 hover:border-[#ffffff20]`}
                                    >
                                        {data.invocation}
                                    </div>
                                </CopyOnClick>
                            </div>
                        </div>
                    )}
                </section>

                <section className='flex flex-col gap-3'>
                    <div>
                        <h2 className='text-sm font-medium text-zinc-100'>Docker image</h2>
                        <p className='mt-1 text-sm text-zinc-400'>The container this server runs in.</p>
                    </div>
                    {Object.keys(data.dockerImages).length > 1 && !isCustomImage ? (
                        <InputSpinner visible={loading}>
                            <Dropdown
                                value={variables.dockerImage ?? ''}
                                onChange={(value) => updateSelectedDockerImage(value)}
                                triggerClassName='font-mono'
                                options={Object.keys(data.dockerImages).map((key) => ({
                                    value: data.dockerImages[key] as string,
                                    label: key,
                                }))}
                            />
                        </InputSpinner>
                    ) : (
                        <div className='flex flex-col gap-3'>
                            <CopyOnClick text={imageLabel}>
                                <code className='block cursor-pointer break-all font-mono text-sm text-zinc-200'>
                                    {imageLabel}
                                </code>
                            </CopyOnClick>
                            {isCustomImage && (
                                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                                    <p className='text-sm text-amber-200'>
                                        An administrator set this image. It can&apos;t be changed from here.
                                    </p>
                                    {canEditDockerImage && (
                                        <Button
                                            variant='outline'
                                            className='shrink-0'
                                            onClick={() => setRevertModalVisible(true)}
                                            disabled={loading}
                                        >
                                            {loading && <Spinner size='small' />}
                                            Revert to default
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <section className='flex flex-col gap-2'>
                    <h2 className='text-sm font-medium text-zinc-100'>Built-in variables</h2>
                    <p className='text-sm text-zinc-400'>
                        Always available in the startup command. Click a name to copy it.
                    </p>
                    <div className='mt-2 grid grid-cols-1 gap-x-10 sm:grid-cols-2 xl:grid-cols-3'>
                        {builtinVariables.map((variable) => (
                            <div
                                key={variable.name}
                                className='flex items-baseline justify-between gap-4 border-b border-[#ffffff10] py-2.5'
                            >
                                <CopyOnClick text={variable.name}>
                                    <span className='cursor-pointer font-mono text-xs text-zinc-400 hover:text-zinc-50'>
                                        {variable.name}
                                    </span>
                                </CopyOnClick>
                                <span className='truncate font-mono text-sm text-zinc-200'>{variable.value}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {data.variables.length > 0 && (
                    <section className='flex flex-col'>
                        <div className='mb-2'>
                            <h2 className='text-sm font-medium text-zinc-100'>Variables</h2>
                            <p className='mt-1 text-sm text-zinc-400'>
                                Values specific to this server. Changes are saved as you edit them.
                            </p>
                        </div>
                        <div className='divide-y divide-[#ffffff10]'>
                            {data.variables.map((variable) => (
                                <VariableBox key={variable.envVariable} variable={variable} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </ServerContentBlock>
    );
};

export default StartupContainer;
