import React from 'react';
import { ExecutionProps, Interpolation, Styles } from '../types';
/**
 * Create a component that injects global CSS when mounted. Supports theming and dynamic props.
 *
 * ```tsx
 * const GlobalStyle = createGlobalStyle`
 *   body { margin: 0; font-family: system-ui; }
 * `;
 * // Render <GlobalStyle /> at the root of your app
 * ```
 */
export default function createGlobalStyle<Props extends object>(strings: Styles<Props>, ...interpolations: Array<Interpolation<Props>>): React.NamedExoticComponent<ExecutionProps & Props>;
