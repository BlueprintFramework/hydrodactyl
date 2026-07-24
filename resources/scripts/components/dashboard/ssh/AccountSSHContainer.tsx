import { Eye, EyeSlash, Key, Plus, TrashBin } from '@gravity-ui/icons';
import { format } from 'date-fns';
import { type Actions, useStoreActions } from 'easy-peasy';
import { Field, Form, Formik, type FormikHelpers } from 'formik';
import { useEffect, useState } from 'react';
import { object, string } from 'yup';
import { createSSHKey, deleteSSHKey, useSSHKeys } from '@/api/account/ssh-keys';
import { httpErrorToHuman } from '@/api/http';
import Code from '@/components/elements/Code';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Dialog } from '@/components/elements/dialog';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import Input from '@/components/elements/Input';
import PageContentBlock from '@/components/elements/PageContentBlock';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';
import ServerHeader from '@/components/HeaderManger';
import { Button } from '@/components/ui/button';
import { useFlashKey } from '@/plugins/useFlash';
import type { ApplicationStore } from '@/state';

interface CreateValues {
    name: string;
    publicKey: string;
}

const AccountSSHContainer = () => {
    const [deleteKey, setDeleteKey] = useState<{
        name: string;
        fingerprint: string;
    } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    const { clearAndAddHttpError } = useFlashKey('account:ssh-keys');
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const { data, isValidating, error, mutate } = useSSHKeys({
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error, clearAndAddHttpError]);

    const doDeletion = () => {
        if (!deleteKey) return;

        clearAndAddHttpError();
        Promise.all([
            mutate((data) => data?.filter((value) => value.fingerprint !== deleteKey.fingerprint), false),
            deleteSSHKey(deleteKey.fingerprint),
        ])
            .catch((error) => {
                mutate(undefined, true).catch(console.error);
                clearAndAddHttpError(error);
            })
            .finally(() => {
                setDeleteKey(null);
            });
    };

    const submitCreate = (values: CreateValues, { setSubmitting, resetForm }: FormikHelpers<CreateValues>) => {
        clearFlashes('account:ssh-keys');
        createSSHKey(values.name, values.publicKey)
            .then((key) => {
                resetForm();
                setSubmitting(false);
                mutate((data) => (data || []).concat(key));
                setShowCreateModal(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'account:ssh-keys', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    const toggleKeyVisibility = (fingerprint: string) => {
        setShowKeys((prev) => ({
            ...prev,
            [fingerprint]: !prev[fingerprint],
        }));
    };

    return (
        <PageContentBlock title={'SSH Keys'}>
            <FlashMessageRender byKey='account:ssh-keys' />
            <ServerHeader title='SSH Keys' />

            {/* Create SSH Key Modal */}
            {showCreateModal && (
                <Dialog.Confirm
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title='Add SSH Key'
                    confirm='Add Key'
                    onConfirmed={() => {
                        const form = document.getElementById('create-ssh-form') as HTMLFormElement;
                        if (form) {
                            const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                            if (submitButton) submitButton.click();
                        }
                    }}
                >
                    <Formik
                        onSubmit={submitCreate}
                        initialValues={{ name: '', publicKey: '' }}
                        validationSchema={object().shape({
                            name: string().required('SSH Key Name is required'),
                            publicKey: string().required('Public Key is required'),
                        })}
                    >
                        {({ isSubmitting }) => (
                            <Form id='create-ssh-form' className='space-y-4'>
                                <SpinnerOverlay visible={isSubmitting} />

                                <FormikFieldWrapper
                                    label='SSH Key Name'
                                    name='name'
                                    description='A name to identify this SSH key.'
                                >
                                    <Field name='name' as={Input} className='w-full' />
                                </FormikFieldWrapper>

                                <FormikFieldWrapper
                                    label='Public Key'
                                    name='publicKey'
                                    description='Enter your public SSH key.'
                                >
                                    <Field name='publicKey' as={Input} className='w-full' />
                                </FormikFieldWrapper>

                                <button type='submit' className='hidden' />
                            </Form>
                        )}
                    </Formik>
                </Dialog.Confirm>
            )}

            <div className='w-full h-full min-h-full flex-1 flex flex-col px-2 sm:px-0'>
                <div
                    className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                    style={{
                        animationDelay: '50ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                ></div>

                <div
                    className='transform-gpu skeleton-anim-2'
                    style={{
                        animationDelay: '75ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <div className='rounded-xl p-6 md:p-4 shadow-sm'>
                        <SpinnerOverlay visible={!data && isValidating} />
                        <Dialog.Confirm
                            title={'Delete SSH Key'}
                            confirm={'Delete Key'}
                            open={!!deleteKey}
                            onClose={() => setDeleteKey(null)}
                            onConfirmed={doDeletion}
                        >
                            Removing the <Code>{deleteKey?.name}</Code> SSH key will invalidate its usage across the
                            Panel.
                        </Dialog.Confirm>
                        <div className='mb-4'>
                            <Button
                                variant='secondary'
                                onClick={() => setShowCreateModal(true)}
                                className='flex items-center gap-2'
                            >
                                <Plus width={22} height={22} fill='currentColor' />
                                Add SSH Key
                            </Button>
                        </div>

                        {!data || data.length === 0 ? (
                            <div className='text-center py-12'>
                                <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-mocha-400/20 flex items-center justify-center'>
                                    <Key width={22} height={22} className='text-mocha-200' fill='currentColor' />
                                </div>
                                <h3 className='text-lg font-medium text-cream-400 mb-2'>No SSH Keys</h3>
                                <p className='text-sm text-mocha-200 max-w-sm mx-auto'>
                                    {!data
                                        ? 'Loading your SSH keys...'
                                        : "You haven't added any SSH keys yet. Add one to securely access your servers."}
                                </p>
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                {data.map((key, index) => (
                                    <div
                                        key={key.fingerprint}
                                        className='transform-gpu skeleton-anim-2'
                                        style={{
                                            animationDelay: `${index * 25 + 100}ms`,
                                            animationTimingFunction:
                                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                                        }}
                                    >
                                        <div className='bg-mocha-500 border-mocha-300 border-[1px] rounded-lg transition-all duration-150 p-4'>
                                            <div className='flex items-center justify-between'>
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center gap-3 mb-2'>
                                                        <h4 className='text-sm font-medium text-cream-400 truncate'>
                                                            {key.name}
                                                        </h4>
                                                    </div>
                                                    <div className='flex items-center gap-4 text-xs text-mocha-200'>
                                                        <span>Added: {format(key.createdAt, 'MMM d, yyyy HH:mm')}</span>
                                                        <div className='flex items-center gap-2'>
                                                            <span>Fingerprint:</span>
                                                            <code className='flex gap-1 font-mono px-2 py-1 bg-mocha-400 border border-mocha-400 rounded text-cream-400'>
                                                                {showKeys[key.fingerprint] ? (
                                                                    <EyeSlash
                                                                        onClick={() =>
                                                                            toggleKeyVisibility(key.fingerprint)
                                                                        }
                                                                        className='hover:cursor-pointer'
                                                                        width={18}
                                                                        height={18}
                                                                        fill='currentColor'
                                                                    />
                                                                ) : (
                                                                    <Eye
                                                                        onClick={() =>
                                                                            toggleKeyVisibility(key.fingerprint)
                                                                        }
                                                                        className='hover:cursor-pointer'
                                                                        width={18}
                                                                        height={18}
                                                                        fill='currentColor'
                                                                    />
                                                                )}
                                                                {showKeys[key.fingerprint] ? (
                                                                    <CopyOnClick text={key.fingerprint}>
                                                                        <span>SHA256:${key.fingerprint}</span>
                                                                    </CopyOnClick>
                                                                ) : (
                                                                    'SHA256:••••••••••••••••'
                                                                )}
                                                            </code>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant='attention'
                                                    size='sm'
                                                    className='ml-4'
                                                    onClick={() =>
                                                        setDeleteKey({
                                                            name: key.name,
                                                            fingerprint: key.fingerprint,
                                                        })
                                                    }
                                                >
                                                    <TrashBin width={20} height={20} fill='currentColor' />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};

export default AccountSSHContainer;
