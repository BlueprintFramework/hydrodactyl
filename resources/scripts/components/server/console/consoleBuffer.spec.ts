import type { IBuffer } from '@xterm/xterm';

import { getTerminalBufferText } from '@/components/server/console/consoleBuffer';

const line = (text: string, isWrapped = false) => ({
    isWrapped,
    length: text.length,
    translateToString: () => text,
});

const bufferFrom = (lines: ReturnType<typeof line>[]): IBuffer =>
    ({
        length: lines.length,
        getLine: (y: number) => lines[y],
    }) as unknown as IBuffer;

describe('@/components/server/console/consoleBuffer.ts', () => {
    describe('getTerminalBufferText()', () => {
        it('joins every line with a newline', () => {
            const buffer = bufferFrom([line('first'), line('second'), line('third')]);

            expect(getTerminalBufferText(buffer)).toBe('first\nsecond\nthird');
        });

        it('includes scrollback lines above the viewport', () => {
            const buffer = bufferFrom([line('old output'), line('new output')]);

            expect(getTerminalBufferText(buffer)).toBe('old output\nnew output');
        });

        it('drops trailing blank lines but keeps blank lines within the output', () => {
            const buffer = bufferFrom([line('start'), line(''), line('end'), line(''), line('')]);

            expect(getTerminalBufferText(buffer)).toBe('start\n\nend');
        });

        it('reconstructs soft-wrapped lines without inserting a newline', () => {
            const buffer = bufferFrom([line('a very long line that wa'), line('s wrapped', true), line('next')]);

            expect(getTerminalBufferText(buffer)).toBe('a very long line that was wrapped\nnext');
        });

        it('returns an empty string for an empty buffer', () => {
            expect(getTerminalBufferText(bufferFrom([]))).toBe('');
        });

        it('tolerates missing lines', () => {
            const buffer = {
                length: 2,
                getLine: (y: number) => (y === 0 ? line('only') : undefined),
            } as unknown as IBuffer;

            expect(getTerminalBufferText(buffer)).toBe('only');
        });
    });
});
