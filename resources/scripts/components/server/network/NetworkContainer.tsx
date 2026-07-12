import { Plus } from '@gravity-ui/icons';
import { useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import createServerAllocation from '@/api/server/network/createServerAllocation';
import getServerAllocations from '@/api/swr/getServerAllocations';
import Can from '@/components/elements/Can';
import { Dialog } from '@/components/elements/dialog';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import VirtualizedList from '@/components/elements/VirtualizedList';
import FlashMessageRender from '@/components/FlashMessageRender';
import ServerHeader from '@/components/server/header/ServerHeader';
import AllocationRow from '@/components/server/network/AllocationRow';
import SubdomainManagement from '@/components/server/network/SubdomainManagement';
import { Button } from '@/components/ui/button';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

const NetworkContainer = () => {
    const [_, setLoading] = useState(false);
    const [showSubdomainModal, setShowSubdomainModal] = useState(false);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const allocationLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.allocations);
    const allocations = ServerContext.useStoreState((state) => state.server.data?.allocations, isEqual);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const { data, error, mutate } = getServerAllocations();

    useEffect(() => {
        mutate(allocations);
    }, [allocations, mutate]);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error, clearAndAddHttpError]);

    useDeepCompareEffect(() => {
        if (!data) return;

        setServerFromState((state) => ({ ...state, allocations: data }));
    }, [data]);

    const onCreateAllocation = () => {
        clearFlashes();

        setLoading(true);
        createServerAllocation(uuid)
            .then((allocation) => {
                setServerFromState((s) => ({
                    ...s,
                    allocations: s.allocations.concat(allocation),
                }));
                return mutate(data?.concat(allocation), false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    };

    return (
        <ServerContentBlock title={'Network'} className='p-0!'>
            <ServerHeader />
            <FlashMessageRender byKey={'server:network'} />

            <div className=''>
                <div className='rounded-xl shadow-sm px-4 py-8 sm:px-14 sm:py-14'>
                    <div className='flex items-center justify-between mb-2'>
                        {data && (
                            <Can action={'allocation.create'}>
                                <div className='flex items-center gap-4'>
                                    {(allocationLimit === null || data.length < allocationLimit) && (
                                        <Button variant='secondary' className='gap-2' onClick={onCreateAllocation}>
                                            <Plus width={22} height={22} className='w-4 h-4' fill='currentColor' />
                                            New Allocation
                                        </Button>
                                    )}
                                    <Button
                                        variant='outline'
                                        className='gap-2'
                                        onClick={() => setShowSubdomainModal(true)}
                                    >
                                        Subdomains
                                    </Button>
                                    <span
                                        className={`text-sm ${allocationLimit === 0 ? 'text-red-400' : 'text-zinc-300'} gap-0.5`}
                                    >
                                        {allocationLimit === null
                                            ? `${data.length} allocations `
                                            : allocationLimit === 0
                                              ? 'Allocations disabled'
                                              : `${data.length} of ${allocationLimit}`}
                                    </span>
                                </div>
                            </Can>
                        )}
                    </div>

                    {!data ? (
                        <div className='flex items-center justify-center py-12'>
                            <div className='flex flex-col items-center gap-3'>
                                <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-brand'></div>
                                <p className='text-sm text-neutral-400'>Loading allocations...</p>
                            </div>
                        </div>
                    ) : data.length > 0 ? (
                        <VirtualizedList
                            items={[...data].sort((a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : 0))}
                            renderItem={(allocation) => <AllocationRow allocation={allocation} />}
                            estimateSize={() => 80}
                            gap={12}
                        />
                    ) : (
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
                                            d='M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                </div>
                                <h4 className='text-lg font-medium text-zinc-200 mb-2'>
                                    {allocationLimit === 0 ? 'Allocations unavailable' : 'No allocations found'}
                                </h4>
                                <p className='text-sm text-zinc-400 max-w-sm text-center'>
                                    {allocationLimit === 0
                                        ? 'Network allocations cannot be created for this server.'
                                        : 'Create your first allocation to get started.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Dialog open={showSubdomainModal} onClose={() => setShowSubdomainModal(false)} title='Subdomain Management'>
                <SubdomainManagement onClose={() => setShowSubdomainModal(false)} />
            </Dialog>
        </ServerContentBlock>
    );
};

export default NetworkContainer;
