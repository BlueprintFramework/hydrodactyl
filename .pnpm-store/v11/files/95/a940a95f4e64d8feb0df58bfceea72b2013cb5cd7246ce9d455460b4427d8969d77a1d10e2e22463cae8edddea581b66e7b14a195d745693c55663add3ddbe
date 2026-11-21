/// <reference types="hoist-non-react-statics" />
import * as React from 'react';
import { FormikProps, GenericFieldHTMLAttributes, FieldMetaProps, FieldInputProps } from './types';
import { FieldConfig } from './Field';
export interface FastFieldProps<V = any> {
    field: FieldInputProps<V>;
    meta: FieldMetaProps<V>;
    form: FormikProps<V>;
}
export type FastFieldConfig<T> = FieldConfig & {
    /** Override FastField's default shouldComponentUpdate */
    shouldUpdate?: (nextProps: T & GenericFieldHTMLAttributes, props: {}) => boolean;
};
export type FastFieldAttributes<T> = GenericFieldHTMLAttributes & FastFieldConfig<T> & T;
export declare const FastField: React.FC<any> & import("hoist-non-react-statics").NonReactStatics<React.ComponentClass<any, any>, {}>;
