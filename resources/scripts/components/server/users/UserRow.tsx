import { Pencil, Person } from '@gravity-ui/icons';
import { useStoreState } from 'easy-peasy';
import { useNavigate } from 'react-router-dom';

import Can from '@/components/elements/Can';
import RemoveSubuserButton from '@/components/server/users/RemoveSubuserButton';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

import { ServerContext } from '@/state/server';
import type { Subuser } from '@/state/server/subusers';

interface Props {
    subuser: Subuser;
}

const UserRow = ({ subuser }: Props) => {
    const { t } = useTranslation();
    const uuid = useStoreState((state) => state.user?.data?.uuid);
    const navigate = useNavigate();
    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);

    const handleEditClick = () => {
        navigate(`/server/${serverId}/users/${subuser.uuid}/edit`);
    };

    return (
        <div className='flex items-center gap-3 w-full'>
            <div className='flex-shrink-0 w-9 h-9 rounded-lg bg-[#ffffff11] flex items-center justify-center overflow-hidden'>
                {subuser.image ? (
                    <img className='w-full h-full object-cover' src={`${subuser.image}?s=400`} alt='' />
                ) : (
                    <Person width={22} height={22} fill='currentColor' className='text-zinc-400' />
                )}
            </div>

            <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1.5'>
                    <h3 className='text-sm font-medium text-zinc-100 truncate'>{subuser.email}</h3>
                    <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                            subuser.twoFactorEnabled
                                ? 'text-green-300 bg-green-500/20 border border-green-500/30'
                                : 'text-zinc-400 bg-zinc-500/20 border border-zinc-500/30'
                        }`}
                    >
                        {subuser.twoFactorEnabled ? t('server.users.mfa_enabled') : t('server.users.mfa_disabled')}
                    </span>
                </div>
                <p className='text-xs text-zinc-400'>
                    {t('server.users.permissions_assigned', {
                        count: subuser.permissions.filter((permission) => permission !== 'websocket.connect').length,
                    })}
                </p>
            </div>

            <div className='flex-shrink-0 flex items-center gap-2 min-w-[68px] justify-end'>
                {subuser.uuid !== uuid && (
                    <>
                        <Can action={'user.update'}>
                            <Button
                                variant='secondary'
                                size='sm'
                                className='p-2'
                                onClick={handleEditClick}
                                title={t('server.users.edit_subuser')}
                            >
                                <Pencil width={22} height={22} fill='currentColor' />
                            </Button>
                        </Can>
                        <Can action={'user.delete'}>
                            <RemoveSubuserButton subuser={subuser} />
                        </Can>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserRow;
