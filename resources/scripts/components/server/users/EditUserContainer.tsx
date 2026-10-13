import { Person } from '@gravity-ui/icons';
import { type Actions, useStoreActions } from 'easy-peasy';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { httpErrorToHuman } from '@/api/http';
import getServerSubusers from '@/api/server/users/getServerSubusers';

import ServerContentBlock from '@/components/elements/ServerContentBlock';
import ServerHeader from '@/components/server/header/ServerHeader';
import UserFormComponent from '@/components/server/users/UserFormComponent';
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

    const back = () => navigate(`/server/${serverId}/users`);
    const isLoading = fetching || (!subuser && subusers.length === 0);

    return (
        <ServerContentBlock title={t('server.users.edit_title')} className='p-0!'>
            {subuser && <ServerHeader />}

            {isLoading ? (
                <div className='flex items-center justify-center py-24'>
                    <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-brand' />
                </div>
            ) : !subuser ? (
                <div className='px-4 py-16 text-center sm:px-14'>
                    <h1 className='text-sm font-medium text-zinc-100'>{t('server.users.not_found_title')}</h1>
                    <p className='mt-1 text-sm text-zinc-400'>{t('server.users.not_found_description')}</p>
                </div>
            ) : (
                <div className='flex flex-col gap-12 px-4 py-8 sm:px-14 sm:py-14'>
                    <div className='flex items-center gap-4 rounded-xl border border-[#ffffff10] bg-[#ffffff08] px-4 py-4'>
                        <div className='flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#ffffff11]'>
                            {subuser.image ? (
                                <img className='h-full w-full object-cover' src={`${subuser.image}?s=400`} alt='' />
                            ) : (
                                <Person width={22} height={22} fill='currentColor' className='text-zinc-400' />
                            )}
                        </div>
                        <div className='min-w-0'>
                            <div className='flex items-center gap-2'>
                                <h1 className='truncate text-sm font-medium text-zinc-100'>{subuser.username}</h1>
                                <span
                                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                                        subuser.twoFactorEnabled
                                            ? 'border border-green-500/30 bg-green-500/20 text-green-300'
                                            : 'border border-zinc-500/30 bg-zinc-500/20 text-zinc-400'
                                    }`}
                                >
                                    {subuser.twoFactorEnabled
                                        ? t('server.users.mfa_enabled')
                                        : t('server.users.mfa_disabled')}
                                </span>
                            </div>
                            <p className='mt-1 truncate text-xs text-zinc-400'>{subuser.email}</p>
                        </div>
                    </div>
                    <UserFormComponent
                        subuser={subuser}
                        onSuccess={back}
                        onCancel={back}
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
