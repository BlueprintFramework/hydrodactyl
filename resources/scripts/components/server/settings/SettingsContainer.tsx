import { type Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import { toast } from 'sonner';
import { object, string } from 'yup';
import { httpErrorToHuman } from '@/api/http';
import reinstallServer from '@/api/server/reinstallServer';
import renameServer from '@/api/server/renameServer';
import Can from '@/components/elements/Can';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Dialog } from '@/components/elements/dialog';
import Field from '@/components/elements/Field';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import ServerHeader from '@/components/server/header/ServerHeader';
import { Button } from '@/components/ui/button';
import { ip } from '@/lib/formatters';
import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

interface Values {
    name: string;
    description: string;
}

const rowClass = 'flex items-baseline justify-between gap-4 border-b border-[#ffffff10] py-2.5';

const SettingsContainer = () => {
    const username = useStoreState((state) => state.user.data?.username);
    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data?.node);
    const sftp = ServerContext.useStoreState((state) => state.server.data?.sftpDetails, isEqual);
    const server = ServerContext.useStoreState((state) => state.server.data);
    const setServer = ServerContext.useStoreActions((actions) => actions.server.setServer);

    const { addFlash, addError, clearFlashes } = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.flashes,
    );

    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const sftpAddress = `sftp://${ip(sftp.ip)}:${sftp.port}`;
    const sftpUsername = `${username}.${id}`;

    const submit = ({ name, description }: Values) => {
        clearFlashes('settings');
        toast('Updating server details...');
        if (!server) return;
        renameServer(server.uuid, name, description)
            .then(() => setServer({ ...server, name, description }))
            .catch((error) => {
                console.error(error);
                addError({ key: 'settings', message: httpErrorToHuman(error) });
            })
            .then(() => toast.success('Server details updated!'));
    };

    const reinstall = () => {
        setLoading(true);
        clearFlashes('settings');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: 'Your server has begun the reinstallation process.',
                });
            })
            .catch((error) => {
                console.error(error);
                addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => {
                setLoading(false);
                setModalVisible(false);
            });
    };

    useEffect(() => {
        clearFlashes('settings');
    }, [clearFlashes]);

    return (
        <ServerContentBlock title={'Settings'} className='p-0!'>
            <ServerHeader />
            <Dialog.Confirm
                open={modalVisible}
                title={'Confirm server reinstallation'}
                confirm={'Yes, reinstall server'}
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
                loading={loading}
            >
                Your server will be stopped and some files may be deleted or modified during this process, are you sure
                you wish to continue?
            </Dialog.Confirm>

            <div className='flex flex-col gap-12 px-4 py-8 sm:px-14 sm:py-14'>
                <FlashMessageRender byKey={'settings'} />

                <Can action={'settings.rename'}>
                    <Formik
                        onSubmit={submit}
                        initialValues={{
                            name: server.name,
                            description: server.description,
                        }}
                        validationSchema={object().shape({
                            name: string().required().min(1),
                            description: string().nullable(),
                        })}
                    >
                        <Form>
                            <section className='flex flex-col gap-4'>
                                <div className='flex items-start justify-between gap-4'>
                                    <div>
                                        <h2 className='text-sm font-medium text-zinc-100'>Server details</h2>
                                        <p className='mt-1 text-sm text-zinc-400'>
                                            The name and description shown for this server.
                                        </p>
                                    </div>
                                    <Button variant='secondary' type='submit' className='shrink-0'>
                                        Save
                                    </Button>
                                </div>
                                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                                    <Field id={'name'} name={'name'} label={'Name'} type={'text'} />
                                    <Field
                                        id={'description'}
                                        name={'description'}
                                        label={'Description'}
                                        type={'text'}
                                    />
                                </div>
                            </section>
                        </Form>
                    </Formik>
                </Can>

                <Can action={'file.sftp'}>
                    <section className='flex flex-col gap-4'>
                        <div className='flex items-start justify-between gap-4'>
                            <div>
                                <h2 className='text-sm font-medium text-zinc-100'>SFTP</h2>
                                <p className='mt-1 text-sm text-zinc-400'>
                                    Connect with the same password you use for this panel. Click a value to copy it.
                                </p>
                            </div>
                            <a href={`sftp://${sftpUsername}@${ip(sftp.ip)}:${sftp.port}`}>
                                <Button variant='secondary' className='shrink-0'>
                                    Launch SFTP
                                </Button>
                            </a>
                        </div>
                        <div className='grid grid-cols-1 gap-x-10 sm:grid-cols-2'>
                            <div className={rowClass}>
                                <span className='text-xs text-zinc-500'>Address</span>
                                <CopyOnClick text={sftpAddress}>
                                    <span className='cursor-pointer truncate font-mono text-sm text-zinc-200 hover:text-zinc-50'>
                                        {sftpAddress}
                                    </span>
                                </CopyOnClick>
                            </div>
                            <div className={rowClass}>
                                <span className='text-xs text-zinc-500'>Username</span>
                                <CopyOnClick text={sftpUsername}>
                                    <span className='cursor-pointer truncate font-mono text-sm text-zinc-200 hover:text-zinc-50'>
                                        {sftpUsername}
                                    </span>
                                </CopyOnClick>
                            </div>
                        </div>
                    </section>
                </Can>

                <section className='flex flex-col gap-2'>
                    <h2 className='text-sm font-medium text-zinc-100'>Debug</h2>
                    <p className='text-sm text-zinc-400'>Click a value to copy it.</p>
                    <div className='mt-2 grid grid-cols-1 gap-x-10 sm:grid-cols-2'>
                        <div className={rowClass}>
                            <span className='text-xs text-zinc-500'>Node</span>
                            <CopyOnClick text={node}>
                                <span className='cursor-pointer truncate font-mono text-sm text-zinc-200 hover:text-zinc-50'>
                                    {node}
                                </span>
                            </CopyOnClick>
                        </div>
                        <div className={rowClass}>
                            <span className='text-xs text-zinc-500'>Server ID</span>
                            <CopyOnClick text={uuid}>
                                <span className='cursor-pointer truncate font-mono text-sm text-zinc-200 hover:text-zinc-50'>
                                    {uuid}
                                </span>
                            </CopyOnClick>
                        </div>
                    </div>
                </section>

                <Can action={'settings.reinstall'}>
                    <section className='flex items-start justify-between gap-4'>
                        <div>
                            <h2 className='text-sm font-medium text-zinc-100'>Reinstall</h2>
                            <p className='mt-1 max-w-xl text-sm text-zinc-400'>
                                Stops the server and runs its installation script again. Files can be deleted or
                                modified, so back up anything you need first.
                            </p>
                        </div>
                        <Button
                            variant='attention'
                            className='shrink-0'
                            onClick={() => setModalVisible(true)}
                            disabled={loading}
                        >
                            Reinstall server
                        </Button>
                    </section>
                </Can>
            </div>
        </ServerContentBlock>
    );
};

export default SettingsContainer;
