'use client';
import * as react from 'react';
import { ComponentType, ReactElement, ForwardedRef, ReactNode, JSX } from 'react';
import { M as MillionProps, O as Options, c as MillionArrayProps } from '../shared/million.50256fe7.js';

declare const block: <P extends MillionProps>(Component: ComponentType<P>, options?: Options<P>) => ComponentType<P>;
declare function For<T>({ each, children, ssr, svg }: MillionArrayProps<T>): ReactElement<{
    suppressHydrationWarning: boolean;
}, string | react.JSXElementConstructor<any>> | react.CElement<{
    each: T[];
    children: (value: T, i: number) => globalThis.JSX.Element;
    ssr: boolean | undefined;
    svg: boolean | undefined;
}, react.Component<{
    each: T[];
    children: (value: T, i: number) => globalThis.JSX.Element;
    ssr: boolean | undefined;
    svg: boolean | undefined;
}, any, any>> | null;
declare const importSource: (callback: () => void) => void;
declare const createSSRBoundary: <P extends MillionProps>(Component: ComponentType<P>, props: P, ref: ForwardedRef<unknown>, noSlot: boolean, id: string, svg?: boolean) => ReactElement<any, string | react.JSXElementConstructor<any>> | react.FunctionComponentElement<{
    children?: ReactNode;
}>;
declare const createRSCBoundary: <P extends MillionProps>(Component: ComponentType<P>, noSlot: boolean, svg?: boolean) => react.MemoExoticComponent<react.ForwardRefExoticComponent<react.PropsWithoutRef<P> & react.RefAttributes<unknown>>>;
interface CompiledBlockOptions extends Omit<Options<MillionProps>, 'shouldUpdate'> {
    portals?: string[];
}
declare function compiledBlock(render: (props: MillionProps) => JSX.Element, { portals, ...options }: CompiledBlockOptions): ComponentType<MillionProps>;

export { For, block, compiledBlock, createRSCBoundary, createSSRBoundary, importSource };
