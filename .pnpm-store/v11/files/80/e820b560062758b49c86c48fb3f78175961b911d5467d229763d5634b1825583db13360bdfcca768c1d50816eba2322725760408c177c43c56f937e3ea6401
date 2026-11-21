import { StyledComponentBrand } from '../types';
/**
 * Type guard that returns true if the target is a styled component.
 *
 * Accepts both `object` and `function` carriers because Preact's react-compat
 * `forwardRef` returns a function while React's returns an object (#5736).
 * `$$typeof` is checked alongside the `styledComponentId` brand so that HOCs
 * which hoist non-React statics from a styled component (and therefore inherit
 * `styledComponentId`) are not mistaken for real styled components - those
 * HOCs do not carry the forward-ref `$$typeof`.
 */
export default function isStyledComponent(target: any): target is StyledComponentBrand;
