import { Person } from '@gravity-ui/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ServerContentBlock from '@/components/elements/ServerContentBlock';
import ServerHeader from '@/components/server/header/ServerHeader';
import UserFormComponent from '@/components/server/users/UserFormComponent';
import { ServerContext } from '@/state/server';

const CreateUserContainer = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [identifier, setIdentifier] = useState('');

    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);
    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');

    const back = () => navigate(`/server/${serverId}/users`);

    return (
        <ServerContentBlock title={'Invite User'} className='p-0!' showFlashKey={'users'}>
            <ServerHeader />
            <div className='flex flex-col gap-8 px-4 py-8 sm:px-14 sm:py-14'>
                <div className='flex items-center gap-4 rounded-xl border border-[#ffffff10] bg-[#ffffff08] px-4 py-4'>
                    <div className='flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#ffffff11]'>
                        <Person width={22} height={22} fill='currentColor' className='text-zinc-400' />
                    </div>
                    <div className='min-w-0'>
                        <h1 className='truncate text-sm font-medium text-zinc-100'>{trimmed || 'New user'}</h1>
                        <p className='mt-1 truncate text-xs text-zinc-400'>
                            {trimmed
                                ? isEmail
                                    ? 'Inviting by email'
                                    : 'Adding an existing username'
                                : 'Enter a username or email below.'}
                        </p>
                    </div>
                </div>
                <UserFormComponent
                    identifier={identifier}
                    onIdentifierChange={setIdentifier}
                    onSuccess={back}
                    onCancel={back}
                    flashKey='user:create'
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                />
            </div>
        </ServerContentBlock>
    );
};

export default CreateUserContainer;
