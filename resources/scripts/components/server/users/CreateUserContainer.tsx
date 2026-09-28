import { ChevronLeft } from '@gravity-ui/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ServerContentBlock from '@/components/elements/ServerContentBlock';
import ServerHeader from '@/components/server/header/ServerHeader';
import UserFormComponent from '@/components/server/users/UserFormComponent';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { ServerContext } from '@/state/server';

const CreateUserContainer = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);

    const handleSuccess = () => {
        navigate(`/server/${serverId}/users`);
    };

    const handleCancel = () => {
        navigate(`/server/${serverId}/users`);
    };

    return (
        <ServerContentBlock title={t('server.users.create_title')} className='p-0!' showFlashKey={'users'}>
            <ServerHeader />
            <div className='px-2 pt-2 sm:px-14 sm:pt-14 flex flex-col sm:flex-row items-center gap-4'>
                <div className='flex gap-2'>
                    <Button
                        variant='secondary'
                        onClick={() => navigate(`/server/${serverId}/users`)}
                        className='gap-2'
                        disabled={isSubmitting}
                    >
                        <ChevronLeft width={22} height={22} className='w-4 h-4' fill='currentColor' />
                        {t('server.users.back_to_users')}
                    </Button>
                </div>
            </div>

            <div className='px-2 sm:px-14 pt-6'>
                <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem] mb-8'>
                    {t('server.users.create_heading')}
                </h1>
                <UserFormComponent
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                    flashKey='user:create'
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                />
            </div>
        </ServerContentBlock>
    );
};

export default CreateUserContainer;
