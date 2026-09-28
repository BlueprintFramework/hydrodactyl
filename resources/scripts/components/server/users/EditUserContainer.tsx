import { ChevronLeft, Person } from '@gravity-ui/icons';
import { type Actions, useStoreActions } from 'easy-peasy';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { httpErrorToHuman } from '@/api/http';
import getServerSubusers from '@/api/server/users/getServerSubusers';

import ServerContentBlock from '@/components/elements/ServerContentBlock';
import ServerHeader from '@/components/server/header/ServerHeader';
import UserFormComponent from '@/components/server/users/UserFormComponent';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import type { Subuser } from '@/state/server/subusers';

const EditUserContainer = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetching, setFetching] = useState(false);

    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const subusers = ServerContext.useStoreState((state) => state.subusers.data);
    const setSubusers = ServerContext.useStoreActions((actions) => actions.subusers.setSubusers);
    const { addError } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const subuser = subusers.find((s: Subuser) => s.uuid === id);

    useEffect(() => {
        if (subusers.length === 0 && uuid) {
            setFetching(true);
            getServerSubusers(uuid)
                .then((users) => {
                    setSubusers(users);
                    setFetching(false);
                })
                .catch((error) => {
                    console.error(error);
                    addError({ key: 'users', message: httpErrorToHuman(error) });
                    setFetching(false);
                });
        }
    }, [uuid, subusers.length, setSubusers, addError]);

    useEffect(() => {
        if (!fetching && subusers.length > 0 && !subuser) {
            navigate(`/server/${serverId}/users`);
        }
    }, [fetching, subuser, subusers, navigate, serverId]);

    const handleBack = () => {
        navigate(`/server/${serverId}/users`);
    };

    const isLoading = fetching || (!subuser && subusers.length === 0);

    return (
        <ServerContentBlock title={t('server.users.edit_title')} className='p-0!'>
            {subuser && <ServerHeader />}

            <div className='px-2 pt-2 sm:px-14 sm:pt-14 flex flex-col sm:flex-row items-center gap-4'>
                <div className='flex gap-2'>
                    <Button variant='secondary' onClick={handleBack} className='gap-2' disabled={isSubmitting}>
                        <ChevronLeft width={22} height={22} className='w-4 h-4' fill='currentColor' />
                        {t('server.users.back_to_users')}
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            ) : !subuser ? (
                <div className='flex flex-col items-center justify-center min-h-[60vh] py-12 px-4'>
                    <div className='text-center'>
                        <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                            <Person width={22} height={22} className='w-8 h-8 text-zinc-400' fill='currentColor' />
                        </div>
                        <h3 className='text-lg font-medium text-zinc-200 mb-2'>{t('server.users.not_found_title')}</h3>
                        <p className='text-sm text-zinc-400 max-w-sm'>{t('server.users.not_found_description')}</p>
                    </div>
                </div>
            ) : (
                <div className='px-2 sm:px-14 pt-6'>
                    <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem] mb-8'>
                        {t('server.users.edit_heading', { email: subuser.email })}
                    </h1>
                    <UserFormComponent
                        subuser={subuser}
                        onSuccess={handleBack}
                        onCancel={handleBack}
                        flashKey='user:edit'
                        isSubmitting={isSubmitting}
                        setIsSubmitting={setIsSubmitting}
                    />
                </div>
            )}
        </ServerContentBlock>
    );
};

export default EditUserContainer;
