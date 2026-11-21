import StyleSheet from '../sheet';
import { ExecutionContext, RuleSet, Stringifier } from '../types';
type InstanceEntry = {
    name: string;
    rules: string[];
};
export default class GlobalStyle<Props extends object> {
    componentId: string;
    isStatic: boolean;
    rules: RuleSet<Props>;
    /** @internal Per-instance rule cache for shared-group rebuild. */
    instanceRules: Map<number, InstanceEntry>;
    constructor(rules: RuleSet<Props>, componentId: string);
    removeStyles(instance: number, styleSheet: StyleSheet): void;
    renderStyles(instance: number, executionContext: ExecutionContext & Props, styleSheet: StyleSheet, stylis: Stringifier): void;
    private computeRules;
    /**
     * Clear all CSS rules in the shared group and re-insert from surviving instances.
     * Must run synchronously - no yielding between clear and re-insert.
     */
    private rebuildGroup;
}
export {};
