/// <reference types="hoist-non-react-statics" />
import * as React from 'react';
import { FormikContextType, FormikProps, SharedRenderProps } from './types';
export type FieldArrayRenderProps = ArrayHelpers & {
    form: FormikProps<any>;
    name: string;
};
export type FieldArrayConfig = {
    /** Really the path to the array field to be updated */
    name: string;
    /** Should field array validate the form AFTER array updates/changes? */
    validateOnChange?: boolean;
} & SharedRenderProps<FieldArrayRenderProps>;
export interface ArrayHelpers<T extends any[] = any[]> {
    /** Imperatively add a value to the end of an array */
    push<X extends T[number] = T[number]>(obj: X): void;
    /** Curried fn to add a value to the end of an array */
    handlePush<X extends T[number] = T[number]>(obj: X): () => void;
    /** Imperatively swap two values in an array */
    swap: (indexA: number, indexB: number) => void;
    /** Curried fn to swap two values in an array */
    handleSwap: (indexA: number, indexB: number) => () => void;
    /** Imperatively move an element in an array to another index */
    move: (from: number, to: number) => void;
    /** Imperatively move an element in an array to another index */
    handleMove: (from: number, to: number) => () => void;
    /** Imperatively insert an element at a given index into the array */
    insert<X extends T[number] = T[number]>(index: number, value: X): void;
    /** Curried fn to insert an element at a given index into the array */
    handleInsert<X extends T[number] = T[number]>(index: number, value: X): () => void;
    /** Imperatively replace a value at an index of an array  */
    replace<X extends T[number] = T[number]>(index: number, value: X): void;
    /** Curried fn to replace an element at a given index into the array */
    handleReplace<X extends T[number] = T[number]>(index: number, value: X): () => void;
    /** Imperatively add an element to the beginning of an array and return its length */
    unshift<X extends T[number] = T[number]>(value: X): number;
    /** Curried fn to add an element to the beginning of an array */
    handleUnshift<X extends T[number] = T[number]>(value: X): () => void;
    /** Curried fn to remove an element at an index of an array */
    handleRemove: (index: number) => () => void;
    /** Curried fn to remove a value from the end of the array */
    handlePop: () => () => void;
    /** Imperatively remove and element at an index of an array */
    remove<X extends T[number] = T[number]>(index: number): X | undefined;
    /** Imperatively remove and return value from the end of the array */
    pop<X extends T[number] = T[number]>(): X | undefined;
}
/**
 * Some array helpers!
 */
export declare const move: <T>(array: T[], from: number, to: number) => unknown[];
export declare const swap: <T>(arrayLike: ArrayLike<T>, indexA: number, indexB: number) => unknown[];
export declare const insert: <T>(arrayLike: ArrayLike<T>, index: number, value: T) => unknown[];
export declare const replace: <T>(arrayLike: ArrayLike<T>, index: number, value: T) => unknown[];
export declare const FieldArray: React.FC<FieldArrayConfig> & import("hoist-non-react-statics").NonReactStatics<React.ComponentClass<{
    /** Really the path to the array field to be updated */
    name: string;
    /** Should field array validate the form AFTER array updates/changes? */
    validateOnChange?: boolean | undefined;
} & SharedRenderProps<FieldArrayRenderProps> & {
    formik: FormikContextType<any>;
}, any>, {}>;
