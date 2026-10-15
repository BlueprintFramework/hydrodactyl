import { cn } from '@/lib/utils';

import { ServerContext } from '@/state/server';

export const StatusPillHeader = () => {
    const status = ServerContext.useStoreState((state) => state.status.value);

    return (
        <div className='relative h-4 w-4 shrink-0'>
            <div
                className={cn(
                    'absolute inset-0 rounded-full transition',
                    status === 'offline' ? 'bg-red-500' : status === 'running' ? 'bg-green-500' : 'bg-yellow-500',
                )}
            ></div>
            <div
                className={cn(
                    'absolute inset-0 animate-ping rounded-full opacity-45 transition',
                    status === 'offline' ? 'hidden' : status === 'running' ? 'bg-green-500' : 'bg-yellow-500',
                )}
            ></div>
            <div className={`text-sm font-bold hidden`}>
                {status === 'offline'
                    ? 'Offline'
                    : status === 'running'
                      ? 'Online'
                      : status === 'stopping'
                        ? 'Stopping'
                        : status === 'starting'
                          ? 'Starting'
                          : 'Fetching'}
            </div>
        </div>
    );
};
