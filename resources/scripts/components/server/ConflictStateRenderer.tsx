import ScreenBlock from '@/components/elements/ScreenBlock';
import { useTranslation } from '@/i18n/I18nProvider';

import { ServerContext } from '@/state/server';

import Spinner from '../elements/Spinner';

const ConflictStateRenderer = () => {
    const { t } = useTranslation();
    const status = ServerContext.useStoreState((state) => state.server.data?.status || null);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data?.isTransferring || false);
    const isNodeUnderMaintenance = ServerContext.useStoreState(
        (state) => state.server.data?.isNodeUnderMaintenance || false,
    );

    if (status === 'installing') {
        return (
            <div className={'flex flex-col items-center justify-center h-full'}>
                <Spinner size={'large'} />
                <div className='flex flex-col mt-4 text-center px-6'>
                    <span className='text-neutral-100 text-lg font-bold'>{t('server.conflict.installing_title')}</span>
                    <span className='text-neutral-500 text-md font-semibold mt-1'>
                        {t('server.conflict.installing_description')}
                    </span>
                    <span className='text-neutral-500 text-sm mt-3'>
                        {t('server.conflict.installing_progress_hint')}
                    </span>
                </div>
            </div>
        );
    }

    // Failed installs used to reuse the "installing" spinner copy, which made
    // reinstall_failed look like a hang. Show an explicit failure screen instead.
    if (status === 'install_failed' || status === 'reinstall_failed') {
        return (
            <ScreenBlock
                title={t('server.conflict.install_failed_title')}
                message={t('server.conflict.install_failed_description')}
            />
        );
    }

    if (status === 'suspended') {
        return (
            <ScreenBlock
                title={t('server.conflict.suspended_title')}
                message={t('server.conflict.suspended_description')}
            />
        );
    }

    if (isNodeUnderMaintenance) {
        return (
            <ScreenBlock
                title={t('server.conflict.maintenance_title')}
                message={t('server.conflict.maintenance_description')}
            />
        );
    }

    return (
        <ScreenBlock
            title={isTransferring ? t('server.conflict.transferring_title') : t('server.conflict.restoring_title')}
            message={
                isTransferring
                    ? t('server.conflict.transferring_description')
                    : t('server.conflict.restoring_description')
            }
        />
    );
};

export default ConflictStateRenderer;
