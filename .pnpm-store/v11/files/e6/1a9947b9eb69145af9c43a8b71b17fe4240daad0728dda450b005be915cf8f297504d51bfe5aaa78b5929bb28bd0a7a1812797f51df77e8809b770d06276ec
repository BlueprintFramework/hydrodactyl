import type { BaseObject, IStyledComponentFactory, RuleSet, StyledOptions, WebTarget } from '../types';
/** Test-only: clear the per-displayName counter so component IDs stay stable
 *  across tests. Not for production use. */
export declare const resetIdentifiers: () => void;
declare function createStyledComponent<Target extends WebTarget, OuterProps extends BaseObject, Statics extends BaseObject = BaseObject>(target: Target, options: StyledOptions<'web', OuterProps>, rules: RuleSet<OuterProps>): ReturnType<IStyledComponentFactory<'web', Target, OuterProps, Statics>>;
export default createStyledComponent;
