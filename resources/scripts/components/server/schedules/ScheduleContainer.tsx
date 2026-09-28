import { Plus } from '@gravity-ui/icons';
import { useEffect, useState } from 'react';
import getServerSchedules from '@/api/server/schedules/getServerSchedules';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import VirtualizedList from '@/components/elements/VirtualizedList';
import ServerHeader from '@/components/server/header/ServerHeader';
import EditScheduleModal from '@/components/server/schedules/EditScheduleModal';
import ScheduleRow from '@/components/server/schedules/ScheduleRow';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

function ScheduleContainer() {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:schedules');
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);

    const schedules = ServerContext.useStoreState((state) => state.schedules.data);
    const setSchedules = ServerContext.useStoreActions((actions) => actions.schedules.setSchedules);

    useEffect(() => {
        clearFlashes();

        getServerSchedules(uuid)
            .then((schedules) => setSchedules(schedules))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    }, [uuid, setSchedules, clearFlashes, clearAndAddHttpError]);

    return (
        <ServerContentBlock title={t('navigation.schedules')} className='p-0!' showFlashKey={'server:schedules'}>
            <ServerHeader />
            <div className='rounded-xl shadow-sm px-4 py-8 sm:px-14 sm:py-14 w-full'>
                <div className='flex items-center justify-between mb-2'>
                    {!loading && (
                        <Can action={'schedule.create'}>
                            <div className='flex items-center gap-4'>
                                <Button variant='secondary' className='gap-2' onClick={() => setVisible(true)}>
                                    <Plus width={22} height={22} className='w-4 h-4' fill='currentColor' />
                                    {t('server.schedules.new')}
                                </Button>
                                <span className='text-sm text-zinc-300'>
                                    {t('server.schedules.count', { count: schedules.length })}
                                </span>
                            </div>
                        </Can>
                    )}
                </div>
                {loading ? (
                    <div className='flex items-center justify-center py-12'>
                        <div className='flex flex-col items-center gap-3'>
                            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-brand' />
                            <p className='text-sm text-neutral-400'>{t('server.schedules.loading')}</p>
                        </div>
                    </div>
                ) : schedules.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-12'>
                        <div className='text-center'>
                            <div className='w-12 h-12 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                                <svg
                                    className='w-6 h-6 text-zinc-400'
                                    fill='currentColor'
                                    viewBox='0 0 20 20'
                                    aria-hidden='true'
                                >
                                    <path
                                        fillRule='evenodd'
                                        d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                            </div>
                            <h4 className='text-lg font-medium text-zinc-200 mb-2'>
                                {t('server.schedules.empty_title')}
                            </h4>
                            <p className='text-sm text-zinc-400 max-w-sm text-center'>
                                {t('server.schedules.empty_description')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <VirtualizedList
                        items={schedules}
                        renderItem={(schedule) => (
                            <ScheduleRow
                                schedule={schedule}
                                onDeleted={() => {
                                    getServerSchedules(uuid)
                                        .then((schedules) => setSchedules(schedules))
                                        .catch((error) => clearAndAddHttpError(error));
                                }}
                            />
                        )}
                        estimateSize={() => 80}
                        gap={12}
                        itemClassName={undefined}
                    />
                )}
            </div>
            <Can action={'schedule.create'}>
                <EditScheduleModal visible={visible} onDismissed={() => setVisible(false)} />
            </Can>
        </ServerContentBlock>
    );
}

export default ScheduleContainer;
