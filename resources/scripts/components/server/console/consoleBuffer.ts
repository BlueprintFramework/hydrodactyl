import type { IBuffer } from '@xterm/xterm';

/**
 * Serialize the full contents of an xterm buffer — including scrollback — into
 * a plain-text string. Used by the console's "copy" button so users can grab
 * everything the server has printed without scrolling up and selecting by hand.
 *
 * Wrapped rows are stitched back together (xterm marks them with
 * `isWrapped`), so a long line that was soft-wrapped across several rows is
 * copied as a single line. Trailing blank rows (the empty space below the last
 * output) are dropped, while blank lines within the output are preserved.
 */
export const getTerminalBufferText = (buffer: IBuffer): string => {
    const rows: string[] = [];

    for (let i = 0; i < buffer.length; i++) {
        const line = buffer.getLine(i);
        const text = line ? line.translateToString(true) : '';

        if (line?.isWrapped && rows.length > 0) {
            rows[rows.length - 1] += text;
        } else {
            rows.push(text);
        }
    }

    while (rows.length > 0 && rows[rows.length - 1] === '') {
        rows.pop();
    }

    return rows.join('\n');
};
