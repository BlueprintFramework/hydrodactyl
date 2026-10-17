import { Person, Plus } from '@gravity-ui/icons';
import { type Actions, useStoreActions } from 'easy-peasy';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpErrorToHuman } from '@/api/http';
import getServerSubusers from '@/api/server/users/getServerSubusers';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import VirtualizedList from '@/components/elements/VirtualizedList';
import FlashMessageRender from '@/components/FlashMessageRender';
import ServerHeader from '@/components/server/header/ServerHeader';
import UserRow from '@/components/server/users/UserRow';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';

const UsersContainer = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);
    const subusers = ServerContext.useStoreState((state) => state.subusers.data);
    const setSubusers = ServerContext.useStoreActions((actions) => actions.subusers.setSubusers);

    const getPermissions = useStoreActions((actions: Actions<ApplicationStore>) => actions.permissions.getPermissions);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    useEffect(() => {
        clearFlashes('users');
        getServerSubusers(uuid)
            .then((subusers) => {
                setSubusers(subusers);
                setLoading(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ key: 'users', message: httpErrorToHuman(error) });
            });
    }, [uuid, addError, setSubusers, clearFlashes]);

    useEffect(() => {
        getPermissions().catch((error) => {
            addError({ key: 'users', message: httpErrorToHuman(error) });
            console.error(error);
        });
    }, [getPermissions, addError]);

    return (
        <ServerContentBlock title={t('server.users.title')} className='p-0!'>
            <ServerHeader />
            <FlashMessageRender byKey={'users'} />
            {loading ? (
                <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            ) : (
                <>
                    <div className='px-2 pt-2 sm:px-14 sm:pt-14 flex flex-col sm:flex-row items-center gap-4'>
                        <div className='flex gap-2'>
                            <Can action={'user.create'}>
                                <Button
                                    variant='secondary'
                                    onClick={() => navigate(`/server/${serverId}/users/new`)}
                                    className='gap-2'
                                >
                                    <Plus width={22} height={22} className='w-4 h-4' fill='currentColor' />
                                    {t('server.users.new_user')}
                                </Button>
                            </Can>
                        </div>
                        <p className='text-sm text-zinc-300 text-center sm:text-right'>
                            {t('server.users.count', { count: subusers.length })}
                        </p>
                    </div>
                    <div className='px-2 sm:px-14 pt-2'>
                        {!subusers.length ? (
                            <div className='flex flex-col items-center justify-center min-h-[60vh] py-12 px-4'>
                                <div className='text-center'>
                                    <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                                        <Person
                                            width={22}
                                            height={22}
                                            className='w-8 h-8 text-zinc-400'
                                            fill='currentColor'
                                        />
                                    </div>
                                    <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                                        {t('server.users.empty_title')}
                                    </h3>
                                    <p className='text-sm text-zinc-400 max-w-sm'>
                                        {t('server.users.empty_description')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <VirtualizedList
                                items={subusers}
                                renderItem={(subuser) => <UserRow subuser={subuser} />}
                                estimateSize={() => 80}
                                gap={12}
                            />
                        )}
                    </div>
                </>
            )}
        </ServerContentBlock>
    );
};

export default UsersContainer;
