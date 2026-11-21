'use client';
import { ReactPortal } from 'react';

type MillionProps = Record<string, any>;
interface Options<T extends MillionProps> {
    scoped?: true;
    name?: string;
    shouldUpdate?: (oldProps: T, newProps: T) => boolean;
    block?: any;
    ssr?: boolean;
    svg?: boolean;
    as?: string;
    rsc?: boolean;
    compiled?: boolean;
    experimental_noSlot?: boolean;
}
interface MillionArrayProps<T> {
    each: T[];
    children: (value: T, i: number) => JSX.Element;
    memo?: true;
    ssr?: boolean;
    svg?: boolean;
    as?: string;
    html?: string;
    rsc?: boolean;
    [key: string]: any;
}
interface ArrayCache<T> {
    each: T[] | null;
    children: T[] | null;
    mounted: boolean;
    block?: ReturnType<typeof block>;
}
interface MillionPortal {
    foreign: true;
    current: HTMLElement;
    portal: ReactPortal;
    unstable?: boolean;
}

declare const enum Flags {
    Child = 1,
    Attribute = 2,
    Event = 4,
    StyleAttribute = 8,
    SvgAttribute = 16,
    Block = 32
}
type VNode = VElement | string | number | bigint | boolean | undefined | null;
interface VElement {
    type: string;
    props: MillionProps & {
        children?: (VNode | Hole)[];
    };
    key?: string | number;
}
interface Hole {
    $: string;
}
declare abstract class AbstractBlock {
    r?: HTMLElement;
    e?: Edit[];
    l?: HTMLElement | null;
    g?: ((root: HTMLElement) => HTMLElement[]) | null;
    _u?: ((oldProps: MillionProps, newProps: MillionProps) => boolean) | null;
    _t?: HTMLElement | null;
    d?: MillionProps | null;
    k?: string | null;
    c?: HTMLElement[];
    abstract p(block: AbstractBlock): HTMLElement;
    abstract m(parent?: HTMLElement, refNode?: Node | null, hydrateNode?: Node | null): HTMLElement;
    abstract v(block: AbstractBlock | null, refNode: Node | null): void;
    abstract x(): void;
    abstract u(oldProps: MillionProps, newProps: MillionProps): boolean;
    abstract s(): string;
    abstract t(): HTMLElement | null | undefined;
}
interface EditAttribute {
    t: Flags.Attribute;
    n: string;
    v: null;
    h: string;
    i: null;
    l: null;
    p: null;
    b: null;
}
interface EditStyleAttribute {
    t: Flags.StyleAttribute;
    n: string;
    v: null;
    h: string;
    i: null;
    l: null;
    p: null;
    b: null;
}
interface EditSvgAttribute {
    t: Flags.SvgAttribute;
    n: string;
    v: null;
    h: string;
    i: null;
    l: null;
    p: null;
    b: null;
}
interface EditChild {
    t: Flags.Child;
    n: null;
    v: null;
    h: string;
    i: number;
    l: null;
    p: null;
    b: null;
}
interface EditEvent {
    t: Flags.Event;
    n: string;
    v: null;
    h: string;
    i: null;
    l: null;
    p: ((listener: EventListener) => void) | null;
    b: null;
}
interface InitEvent {
    t: Flags.Event;
    n: string;
    v: null;
    h: null;
    i: null;
    l: EventListener;
    p: null;
    b: null;
}
interface InitChild {
    t: Flags.Child;
    n: null;
    v: string;
    h: null;
    i: number;
    l: null;
    p: null;
    b: null;
}
interface InitBlock {
    t: Flags.Block;
    n: null;
    v: null;
    h: null;
    i: number;
    l: null;
    p: null;
    b: AbstractBlock;
}
interface Edit {
    p: number[] | null;
    e: (EditAttribute | EditStyleAttribute | EditSvgAttribute | EditChild | EditEvent)[];
    i: (InitChild | InitEvent | InitBlock)[] | null;
}

declare const block: (fn: (props?: MillionProps) => VElement, unwrap?: ((vnode: VElement) => VNode) | undefined, shouldUpdate?: ((oldProps: MillionProps, newProps: MillionProps) => boolean) | undefined, svg?: boolean) => <T extends MillionProps>(props?: T | null | undefined, key?: string, shouldUpdateCurrentBlock?: ((oldProps: MillionProps, newProps: MillionProps) => boolean) | undefined) => Block;
declare const mount: (block: AbstractBlock, parent?: HTMLElement, hydrateNode?: HTMLElement) => HTMLElement;
declare const patch: (oldBlock: AbstractBlock, newBlock: AbstractBlock) => HTMLElement;
declare class Block extends AbstractBlock {
    r: HTMLElement;
    e: Edit[];
    constructor(root: HTMLElement, edits: Edit[], props?: MillionProps | null, key?: string | null, shouldUpdate?: ((oldProps: MillionProps, newProps: MillionProps) => boolean) | null, getElements?: ((root: HTMLElement) => HTMLElement[]) | null);
    m(parent?: HTMLElement, refNode?: Node | null, hydrateNode?: HTMLElement | null): HTMLElement;
    p(newBlock: AbstractBlock): HTMLElement;
    v(block?: AbstractBlock | null, refNode?: Node | null): void;
    x(): void;
    u(_oldProps: MillionProps, _newProps: MillionProps): boolean;
    s(): string;
    t(): HTMLElement | null | undefined;
}
declare const withKey: (value: any, key: string) => any;

export { AbstractBlock as A, Block as B, type Edit as E, type MillionProps as M, type Options as O, type VNode as V, type VElement as a, block as b, type MillionArrayProps as c, type MillionPortal as d, type ArrayCache as e, mount as m, patch as p, withKey as w };
