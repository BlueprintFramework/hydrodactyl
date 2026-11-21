import createGlobalStyle from './createGlobalStyle';
type ThemeLeaf = string | number;
/**
 * Recursively maps a theme object so every leaf value becomes
 * a `var(--sc-path, fallback)` CSS string.
 */
type CSSVarTheme<T> = {
    [K in keyof T]: T[K] extends ThemeLeaf ? string : CSSVarTheme<T[K]>;
};
/**
 * The object returned by `createTheme`. Same shape as the input theme but
 * every leaf is a CSS `var()` reference. Also carries a `GlobalStyle`
 * component and the original `raw` theme object.
 */
type ThemeContract<T> = CSSVarTheme<T> & {
    /**
     * A `createGlobalStyle` component that emits `:root` CSS custom properties
     * from the current ThemeProvider context. Mount this once at the root of
     * your app so RSC components can consume theme values via CSS variables.
     */
    GlobalStyle: ReturnType<typeof createGlobalStyle>;
    /** The original theme object, for passing to `ThemeProvider`. */
    raw: T;
    /**
     * Same shape as the theme but every leaf is the bare CSS custom property
     * name (e.g. `"--sc-colors-primary"`). Useful for building dark mode
     * overrides without hand-writing variable names.
     *
     * @example
     * ```tsx
     * const { vars } = createTheme({ colors: { bg: '#fff', text: '#000' } });
     * vars.colors.bg  // "--sc-colors-bg"
     *
     * const DarkMode = createGlobalStyle`
     *   .dark {
     *     ${vars.colors.bg}: #111;
     *     ${vars.colors.text}: #eee;
     *   }
     * `;
     * ```
     */
    vars: CSSVarTheme<T>;
    /**
     * Read the current resolved CSS variable values from the DOM and return
     * an object with the same shape as the original theme. Each leaf is the
     * computed value (e.g. `"#0070f3"`), not the `var()` reference.
     *
     * Optionally pass a target element to read scoped variables from
     * (defaults to `document.documentElement`).
     *
     * Client-only - throws if called on the server.
     */
    resolve(el?: Element): T;
};
interface CreateThemeOptions {
    /**
     * Prefix for CSS variable names. Defaults to `"sc"`.
     * Useful for isolation when multiple design systems or microfrontends
     * coexist on the same page.
     *
     * @example
     * createTheme(theme, { prefix: 'ds' })
     * // → var(--ds-colors-primary, #0070f3)
     */
    prefix?: string;
    /**
     * CSS selector for the variable declarations. Defaults to `":root"`.
     * Use `":host"` for web components / Shadow DOM, or a class selector
     * for scoped theming.
     *
     * @example
     * createTheme(theme, { selector: ':host' })
     * // → :host { --sc-colors-primary: #0070f3; }
     */
    selector?: string;
}
/**
 * Create a theme backed by CSS custom properties, bridging `ThemeProvider` and CSS variables.
 *
 * Returns an object with the same shape as the input theme, but every leaf value
 * is a `var(--prefix-*, fallback)` CSS string. Use these in styled component
 * templates - they work in both client and RSC contexts.
 *
 * Mount the returned `GlobalStyle` component inside your `ThemeProvider` to emit
 * the CSS variables. When the theme changes (e.g. light → dark), the variables
 * update automatically.
 *
 * @example
 * ```tsx
 * const theme = createTheme({
 *   colors: { primary: '#0070f3', text: '#111' },
 * });
 *
 * // Root layout (client):
 * <ThemeProvider theme={themes[preset]}>
 *   <theme.GlobalStyle />
 *   {children}
 * </ThemeProvider>
 *
 * // Any RSC file:
 * const Card = styled.div`
 *   color: ${theme.colors.primary};
 *   // → "var(--sc-colors-primary, #0070f3)"
 * `;
 * ```
 */
export default function createTheme<T extends Record<string, any>>(defaultTheme: T, options?: CreateThemeOptions): ThemeContract<T>;
export {};
