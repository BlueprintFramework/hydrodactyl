import { useEffect, useMemo } from 'react';
import HeaderCentered from '@/components/dashboard/header/HeaderCentered';
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
            <HeaderCentered className='flex items-center gap-6'>
                <div className='flex items-center gap-3'>
                    <StatusPillHeader />
                    <span className='xl:max-w-[20vw] min-w-0 truncate'>{name}</span>
                </div>

                <div className='hidden md:block border-l border-gray-200 h-6' />
                <div className='hidden md:flex'>
                    <ServerDetailsHeader />
                </div>
            </HeaderCentered>
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
