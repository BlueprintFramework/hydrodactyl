import { IInlineStyleConstructor, StyleSheet } from '../types';
export declare const RN_UNSUPPORTED_VALUES: string[];
/**
 * Extract CSS declaration pairs from flat CSS text.
 * Only handles `property: value;` - selectors, at-rules, and nesting
 * are not supported (and not expected in the native inline style path).
 */
export declare function parseCSSDeclarations(rawCss: string): [string, string][];
/** Clear the cached CSS-to-style-object mappings. Useful in tests or long-running RN apps with highly dynamic styles. */
export declare const resetStyleCache: () => void;
/**
 * Parse flat CSS into a style object via css-to-react-native, with caching.
 */
export declare function cssToStyleObject(flatCSS: string, styleSheet: StyleSheet): any;
/**
 * InlineStyle takes arbitrary CSS and generates a flat object
 */
export default function makeInlineStyleClass<Props extends object>(styleSheet: StyleSheet): IInlineStyleConstructor<Props>;
