import type React from 'react';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface HeaderContextType {
    headerActions: ReactNode;
    leftActions: ReactNode;
    centerActions: ReactNode;
    rightActions: ReactNode;
    setHeaderActions: (actions: ReactNode) => void;
    setLeftActions: (actions: ReactNode) => void;
    setCenterActions: (actions: ReactNode) => void;
    setRightActions: (actions: ReactNode) => void;
    clearHeaderActions: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [headerActions, setHeaderActions] = useState<ReactNode>(null);
    const [leftActions, setLeftActions] = useState<ReactNode>(null);
    const [centerActions, setCenterActions] = useState<ReactNode>(null);
    const [rightActions, setRightActions] = useState<ReactNode>(null);

    const clearHeaderActions = useCallback(() => {
        setHeaderActions(null);
        setLeftActions(null);
        setCenterActions(null);
        setRightActions(null);
    }, []);

    const contextValue = useMemo(
        () => ({
            headerActions,
            leftActions,
            centerActions,
            rightActions,
            setHeaderActions,
            setLeftActions,
            setCenterActions,
            setRightActions,
            clearHeaderActions,
        }),
        [headerActions, leftActions, centerActions, rightActions, clearHeaderActions],
    );

    return <HeaderContext.Provider value={contextValue}>{children}</HeaderContext.Provider>;
};

export const useHeader = () => {
    const context = useContext(HeaderContext);
    if (context === undefined) {
        throw new Error('useHeader must be used within a HeaderProvider');
    }
    return context;
};
