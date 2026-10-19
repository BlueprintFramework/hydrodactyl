import { useEffect, useMemo } from 'react';
import { useHeader } from '@/contexts/HeaderContext';
import { ServerContext } from '@/state/server';
import PowerButtons from './PowerButtons';
import ServerDetailsHeader from './ServerDetailsHeader';
import { StatusPillHeader } from './StatusPillHeader';

interface headerProps {
    powerButtons?: boolean;
}

const ServerHeader = (props: headerProps) => {
    const name = ServerContext.useStoreState((state) => state.server.data?.name);
    const { setHeaderActions, setRightActions, clearHeaderActions } = useHeader();

    const buttonsSection = useMemo(
        () => (
            <PowerButtons
                className={`hidden lg:flex gap-2 items-center justify-center ${props.powerButtons ? '' : 'lg:hidden'}`}
            />
        ),
        [props.powerButtons],
    );

    const statusSection = useMemo(
        () => (
            <div className='flex min-w-0 items-center gap-4'>
                <div className='flex min-w-0 items-center gap-3'>
                    <StatusPillHeader />
                    <span className='min-w-0 -translate-y-0.5 truncate xl:max-w-[20vw]'>{name}</span>
                </div>

                <div className='hidden lg:flex'>
                    <ServerDetailsHeader />
                </div>
            </div>
        ),
        [name],
    );

    useEffect(() => {
        setHeaderActions(statusSection);
        setRightActions(buttonsSection);
        return () => clearHeaderActions();
    }, [setHeaderActions, setRightActions, clearHeaderActions, statusSection, buttonsSection]);

    return null;
};

export default ServerHeader;
