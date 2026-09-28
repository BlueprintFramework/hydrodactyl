import { PlayIcon, Rotate01FreeIcons, StopIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import Can from '@/components/elements/Can';
import { Dialog } from '@/components/elements/dialog';
import type { PowerAction } from '@/components/server/console/ServerConsoleContainer';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

import { ServerContext } from '@/state/server';

interface PowerButtonProps {
    className?: string;
}

const PowerButtons = ({ className }: PowerButtonProps) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const killable = status === 'stopping';
    const onButtonClick = (
        action: PowerAction | 'kill-confirmed',
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    ): void => {
        e.preventDefault();
        if (action === 'kill') {
            setOpen(true);
            return;
        }

        if (instance) {
            if (action === 'start') {
                toast.success(t('server.console.power_starting'));
            } else if (action === 'restart') {
                toast.success(t('server.console.power_restarting'));
            } else {
                toast.success(t('server.console.power_stopping'));
            }
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    useEffect(() => {
        if (status === 'offline') {
            setOpen(false);
        }
    }, [status]);

    if (!status) {
        return null;
    }

    return (
        <div
            className={className}
            style={{
                animationTimingFunction:
                    'linear(0 0%, 0.01 0.8%, 0.04 1.6%, 0.161 3.3%, 0.816 9.4%, 1.046 11.9%, 1.189 14.4%, 1.231 15.7%, 1.254 17%, 1.259 17.8%, 1.257 18.6%, 1.236 20.45%, 1.194 22.3%, 1.057 27%, 0.999 29.4%, 0.955 32.1%, 0.942 33.5%, 0.935 34.9%, 0.933 36.65%, 0.939 38.4%, 1 47.3%, 1.011 49.95%, 1.017 52.6%, 1.016 56.4%, 1 65.2%, 0.996 70.2%, 1.001 87.2%, 1 100%)',
            }}
        >
            <Dialog.Confirm
                open={open}
                hideCloseIcon
                onClose={() => setOpen(false)}
                title={t('server.console.forcibly_stop_title')}
                confirm={t('server.console.continue')}
                onConfirmed={onButtonClick.bind(this, 'kill-confirmed')}
            >
                {t('server.console.forcibly_stop_message')}
            </Dialog.Confirm>
            <Can action={'control.start'}>
                <Button
                    variant={'secondary'}
                    size={'sm'}
                    className='px-3 gap-1 rounded-full'
                    disabled={status !== 'offline'}
                    onClick={onButtonClick.bind(this, 'start')}
                    aria-label={t('server.console.start_server')}
                >
                    <div className='flex flex-row items-center gap-1.5'>
                        <HugeiconsIcon size={16} strokeWidth={2} icon={PlayIcon} className='size-4' />
                        {t('server.console.start')}
                    </div>
                </Button>
            </Can>
            <Can action={'control.restart'}>
                <Button
                    variant={'secondary'}
                    size={'sm'}
                    className='p-1 gap-1 rounded-full size-8'
                    disabled={!status}
                    onClick={onButtonClick.bind(this, 'restart')}
                    aria-label={t('server.console.restart_server')}
                >
                    <HugeiconsIcon size={16} icon={Rotate01FreeIcons} />
                </Button>
            </Can>
            <Can action={'control.stop'}>
                <Button
                    variant={'secondary'}
                    size={'sm'}
                    className='p-1 gap-1 rounded-full size-8'
                    disabled={status === 'offline'}
                    onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
                    aria-label={killable ? t('server.console.kill_server') : t('server.console.stop_server')}
                >
                    <HugeiconsIcon size={16} icon={StopIcon} />
                </Button>
            </Can>
        </div>
    );
};

export default PowerButtons;
