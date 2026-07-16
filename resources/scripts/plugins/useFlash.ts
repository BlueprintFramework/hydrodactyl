import { type Actions, useStoreActions } from 'easy-peasy';
import { useCallback, useMemo } from 'react';

import type { ApplicationStore } from '@/state';
import type { FlashStore } from '@/state/flashes';

interface KeyedFlashStore {
    addError: (message: string, title?: string) => void;
    clearFlashes: () => void;
    clearAndAddHttpError: (error?: Error | string | null) => void;
}

const useFlash = (): Actions<FlashStore> => {
    return useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
};

const useFlashKey = (key: string): KeyedFlashStore => {
    const { addFlash, clearFlashes, clearAndAddHttpError } = useFlash();

    const addError = useCallback(
        (message: string, title?: string) => addFlash({ key, message, title, type: 'error' }),
        [addFlash, key],
    );
    const clearKeyedFlashes = useCallback(() => clearFlashes(key), [clearFlashes, key]);
    const clearAndAddKeyedHttpError = useCallback(
        (error?: Error | string | null) => clearAndAddHttpError({ key, error }),
        [clearAndAddHttpError, key],
    );

    return useMemo(
        () => ({
            addError,
            clearFlashes: clearKeyedFlashes,
            clearAndAddHttpError: clearAndAddKeyedHttpError,
        }),
        [addError, clearKeyedFlashes, clearAndAddKeyedHttpError],
    );
};

export { useFlashKey };
export default useFlash;
