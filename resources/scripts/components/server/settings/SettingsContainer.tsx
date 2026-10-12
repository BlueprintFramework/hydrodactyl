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
const sectionClass =
    'grid grid-cols-1 gap-4 border-b border-[#ffffff10] py-10 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-10';

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

            <div className='mx-auto flex w-full max-w-4xl flex-col px-4 py-8 sm:px-14 sm:py-14'>
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
                        <Form className={sectionClass}>
                            <div>
                                <h2 className='text-sm font-medium text-zinc-100'>Server details</h2>
                                <p className='mt-1 text-sm text-zinc-400'>
                                    The name and description shown for this server.
                                </p>
                            </div>
                            <div className='flex flex-col gap-4'>
                                <div className='flex max-w-lg flex-col gap-4'>
                                    <Field id={'name'} name={'name'} label={'Name'} type={'text'} />
                                    <Field id={'description'} name={'description'} label={'Description'} type={'text'} />
                                </div>
                                <div>
                                    <Button variant='secondary' type='submit'>
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    </Formik>
                </Can>

                <Can action={'file.sftp'}>
                    <section className={sectionClass}>
                        <div>
                            <h2 className='text-sm font-medium text-zinc-100'>SFTP</h2>
                            <p className='mt-1 text-sm text-zinc-400'>
                                Connect with the same password you use for this panel. Click a value to copy it.
                            </p>
                        </div>
                        <div className='flex flex-col gap-4'>
                            <div className='max-w-lg'>
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
                            <div>
                                <a href={`sftp://${sftpUsername}@${ip(sftp.ip)}:${sftp.port}`}>
                                    <Button variant='secondary'>Launch SFTP</Button>
                                </a>
                            </div>
                        </div>
                    </section>
                </Can>

                <section className={sectionClass}>
                    <div>
                        <h2 className='text-sm font-medium text-zinc-100'>Debug</h2>
                        <p className='mt-1 text-sm text-zinc-400'>Click a value to copy it.</p>
                    </div>
                    <div className='max-w-lg'>
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
                    <section className={sectionClass}>
                        <div>
                            <h2 className='text-sm font-medium text-zinc-100'>Reinstall</h2>
                            <p className='mt-1 text-sm text-zinc-400'>
                                Stops the server and runs its installation script again. Files can be deleted or
                                modified, so back up anything you need first.
                            </p>
                        </div>
                        <div className='content-center'>
                            <Button variant='attention' onClick={() => setModalVisible(true)} disabled={loading}>
                                Reinstall server
                            </Button>
                        </div>
                    </section>
                </Can>
            </div>
        </ServerContentBlock>
    );
};

export default SettingsContainer;
