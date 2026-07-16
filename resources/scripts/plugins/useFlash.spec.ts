import { createElement, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { useFlashKey } from '@/plugins/useFlash';

const flashActions = vi.hoisted(() => ({
    addFlash: vi.fn(),
    clearFlashes: vi.fn(),
    clearAndAddHttpError: vi.fn(),
}));

vi.mock('easy-peasy', () => ({
    useStoreActions: (selector: (actions: { flashes: typeof flashActions }) => unknown) =>
        selector({ flashes: flashActions }),
}));

describe('useFlashKey', () => {
    it('keeps keyed callbacks stable across rerenders', () => {
        const renders: ReturnType<typeof useFlashKey>[] = [];

        const Probe = () => {
            const flashes = useFlashKey('server:schedules');
            const [rerendered, setRerendered] = useState(false);
            renders.push(flashes);

            if (!rerendered) {
                setRerendered(true);
            }

            return null;
        };

        renderToString(createElement(Probe));

        expect(renders).toHaveLength(2);
        expect(renders[1]).toBe(renders[0]);
        expect(renders[1]?.clearFlashes).toBe(renders[0]?.clearFlashes);
        expect(renders[1]?.clearAndAddHttpError).toBe(renders[0]?.clearAndAddHttpError);
    });
});
