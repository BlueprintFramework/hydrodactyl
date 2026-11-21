'use client';
import { M as MillionProps, O as Options, c as MillionArrayProps, d as MillionPortal, V as VNode, a as VElement, B as Block, A as AbstractBlock } from '../shared/million.50256fe7.js';
export { r as removeComments } from '../shared/million.9d4df3c1.js';
import * as react from 'react';
import { ComponentType, Ref, createElement, ReactNode, JSX as JSX$1 } from 'react';

declare const block: <P extends MillionProps>(fn: ComponentType<P> | null, options?: Options<P> | null | undefined) => {
    (props: P, forwardedRef: Ref<any>): react.FunctionComponentElement<{
        children?: react.ReactNode;
    }>;
    displayName: string;
};

declare const For: <T>({ each, children, memo, svg, as, ...rest }: MillionArrayProps<T>) => ReturnType<typeof createElement>;

declare const renderReactScope: (vnode: ReactNode, unstable: boolean, portals: MillionPortal[] | undefined, currentIndex: number, key?: string) => any;
declare const unwrap: (vnode: JSX.Element | null) => VNode;

declare const REGISTRY: Map<ComponentType, any>;

interface CompiledBlockOptions extends Omit<Options<MillionProps>, 'shouldUpdate'> {
    portals?: string[];
}
declare function compiledBlock(render: (props: MillionProps) => JSX$1.Element, { portals, ...options }: CompiledBlockOptions): ComponentType<MillionProps>;

declare const INTERNALS: {
    block: (fn: (props?: MillionProps | undefined) => VElement, unwrap?: ((vnode: VElement) => VNode) | undefined, shouldUpdate?: ((oldProps: MillionProps, newProps: MillionProps) => boolean) | undefined, svg?: boolean | undefined) => <T extends MillionProps>(props?: T | null | undefined, key?: string | undefined, shouldUpdateCurrentBlock?: ((oldProps: MillionProps, newProps: MillionProps) => boolean) | undefined) => Block;
    patch: (oldBlock: AbstractBlock, newBlock: AbstractBlock) => HTMLElement;
    mount: (block: AbstractBlock, parent?: HTMLElement | undefined, hydrateNode?: HTMLElement | undefined) => HTMLElement;
};

export { For, INTERNALS, REGISTRY, block, compiledBlock, renderReactScope, unwrap };
