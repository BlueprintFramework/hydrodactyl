import Features from '@feature/Features';
import { memo } from 'react';
import isEqual from 'react-fast-compare';

import { Alert } from '@/components/elements/alert';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import Console from '@/components/server/console/Console';
import StatGraphs from '@/components/server/console/StatGraphs';
import PowerButtons from '@/components/server/header/PowerButtons';
import { ServerContext } from '@/state/server';
import ServerHeader from '../header/ServerHeader';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

const ServerConsoleContainer = () => {
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data?.isTransferring);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data?.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data?.isNodeUnderMaintenance);

    return (
        <PageContentBlock title={'Console'} background={false}>
            <div className='w-full flex flex-col gap-4 lg:h-full lg:flex-row'>
                <div className='flex flex-col gap-4 lg:flex-1 lg:min-h-0'>
                    <ServerHeader powerButtons={true} />
                    <PowerButtons className='flex lg:hidden gap-2 items-center justify-center' />
                    {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                        <Alert type={'warning'} className={''}>
                            {isNodeUnderMaintenance
                                ? 'The node of this server is currently under maintenance and all actions are unavailable.'
                                : isInstalling
                                  ? 'This server is currently running its installation process and most actions are unavailable.'
                                  : 'This server is currently being transferred to another node and all actions are unavailable.'}
                        </Alert>
                    )}
                    <div className='lg:h-full lg:flex-1 lg:min-h-0'>
                        <Console />
                    </div>
                </div>
                <div className='relative w-full overflow-x-visible lg:w-(--sidebar-full-width) lg:overflow-y-auto lg:flex-none lg:-mb-(--main-wrapper-spacing) lg:pb-(--main-wrapper-spacing)'>
                    <div className='flex flex-col gap-4'>
                        <Spinner.Suspense>
                            <StatGraphs />
                        </Spinner.Suspense>
                    </div>
                </div>

                <ErrorBoundary>
                    <Features enabled={eggFeatures} />
                </ErrorBoundary>
            </div>
        </PageContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
