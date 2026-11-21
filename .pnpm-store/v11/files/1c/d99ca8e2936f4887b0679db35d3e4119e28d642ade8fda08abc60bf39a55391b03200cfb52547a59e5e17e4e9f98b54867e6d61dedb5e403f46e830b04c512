import StyleSheet from '../sheet';
import { ExecutionContext, RuleSet, Stringifier } from '../types';
/**
 * Get all compiled CSS for a ComponentStyle's registered names.
 * Returns null on any cache miss (caller falls back to getGroup).
 */
export declare function getCompiledCSS(cs: ComponentStyle, styleSheet: StyleSheet): string | null;
/**
 * ComponentStyle is all the CSS-specific stuff, not the React-specific stuff.
 */
export default class ComponentStyle {
    baseHash: number;
    baseStyle: ComponentStyle | null | undefined;
    componentId: string;
    rules: RuleSet<any>;
    dynamicNameCache: Map<string, string> | undefined;
    constructor(rules: RuleSet<any>, componentId: string, baseStyle?: ComponentStyle | undefined);
    generateAndInjectStyles(executionContext: ExecutionContext, styleSheet: StyleSheet, stylis: Stringifier): string;
}
