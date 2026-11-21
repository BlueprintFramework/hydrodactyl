import * as stylis from 'stylis';
import { Stringifier } from '../types';
/**
 * Check if a quote at position i is escaped. A quote is escaped when preceded
 * by an ODD number of backslashes (\", \\\", etc.). An even number means the
 * backslashes themselves are escaped and the quote is real (\\", \\\\", etc.).
 */
export declare function isEscaped(css: string, i: number): boolean;
/**
 * Unified CSS preprocessor: strips JS-style line comments (//) and validates
 * brace balance in a single pass. Handles strings, parenthesized expressions
 * (any function call), and block comments with one shared state machine.
 *
 * Fast paths:
 *   - No // and no } → return unchanged (zero work)
 *   - No // but has } → brace-only validation (lightweight single pass)
 *   - Has // → full unified pass (strip comments + count braces simultaneously)
 */
export declare function preprocessCSS(css: string): string;
export type ICreateStylisInstance = {
    options?: {
        namespace?: string | undefined;
        prefix?: boolean | undefined;
    } | undefined;
    plugins?: stylis.Middleware[] | undefined;
};
export default function createStylisInstance({ options, plugins, }?: ICreateStylisInstance): Stringifier;
