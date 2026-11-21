import { Interpolation, RuleSet, Styles } from '../types';
/**
 * Tag a CSS template literal for use in styled components, createGlobalStyle, or attrs.
 * Enables interpolation type-checking and shared style blocks.
 *
 * ```tsx
 * const truncate = css`
 *   white-space: nowrap;
 *   overflow: hidden;
 *   text-overflow: ellipsis;
 * `;
 * ```
 */
declare function css(styles: Styles<object>, ...interpolations: Interpolation<object>[]): RuleSet<object>;
declare function css<Props extends object>(styles: Styles<NoInfer<Props>>, ...interpolations: Interpolation<NoInfer<Props>>[]): RuleSet<NoInfer<Props>>;
export default css;
