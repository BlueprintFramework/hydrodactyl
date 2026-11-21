import * as React from 'react';
import { FieldConfig } from './Field';
import { FieldHelperProps, FieldInputProps, FieldMetaProps, FormikConfig, FormikErrors, FormikState, FormikTouched, FormikValues } from './types';
export declare function useFormik<Values extends FormikValues = FormikValues>({ validateOnChange, validateOnBlur, validateOnMount, isInitialValid, enableReinitialize, onSubmit, ...rest }: FormikConfig<Values>): {
    initialValues: Values;
    initialErrors: FormikErrors<unknown>;
    initialTouched: FormikTouched<unknown>;
    initialStatus: any;
    handleBlur: {
        (e: React.FocusEvent<any, Element>): void;
        <T = any>(fieldOrEvent: T): T extends string ? (e: any) => void : void;
    };
    handleChange: {
        (e: React.ChangeEvent<any>): void;
        <T_1 = string | React.ChangeEvent<any>>(field: T_1): T_1 extends React.ChangeEvent<any> ? void : (e: string | React.ChangeEvent<any>) => void;
    };
    handleReset: (e: any) => void;
    handleSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
    resetForm: (nextState?: Partial<FormikState<Values>>) => void;
    setErrors: (errors: FormikErrors<Values>) => void;
    setFormikState: (stateOrCb: FormikState<Values> | ((state: FormikState<Values>) => FormikState<Values>)) => void;
    setFieldTouched: (field: string, touched?: boolean, shouldValidate?: boolean) => Promise<FormikErrors<Values>> | Promise<void>;
    setFieldValue: (field: string, value: React.SetStateAction<any>, shouldValidate?: boolean) => Promise<FormikErrors<Values>> | Promise<void>;
    setFieldError: (field: string, value: string | undefined) => void;
    setStatus: (status: any) => void;
    setSubmitting: (isSubmitting: boolean) => void;
    setTouched: (touched: FormikTouched<Values>, shouldValidate?: boolean) => Promise<FormikErrors<Values>> | Promise<void>;
    setValues: (values: React.SetStateAction<Values>, shouldValidate?: boolean) => Promise<FormikErrors<Values>> | Promise<void>;
    submitForm: () => Promise<any>;
    validateForm: (values?: Values) => Promise<FormikErrors<Values>>;
    validateField: (name: string) => Promise<void> | Promise<string | undefined>;
    isValid: boolean;
    dirty: boolean;
    unregisterField: (name: string) => void;
    registerField: (name: string, { validate }: any) => void;
    getFieldProps: (nameOrOptions: string | FieldConfig<any>) => FieldInputProps<any>;
    getFieldMeta: (name: string) => FieldMetaProps<any>;
    getFieldHelpers: (name: string) => FieldHelperProps<any>;
    validateOnBlur: boolean;
    validateOnChange: boolean;
    validateOnMount: boolean;
    values: Values;
    errors: FormikErrors<Values>;
    touched: FormikTouched<Values>;
    isSubmitting: boolean;
    isValidating: boolean;
    status?: any;
    submitCount: number;
};
export declare function Formik<Values extends FormikValues = FormikValues, ExtraProps = {}>(props: FormikConfig<Values> & ExtraProps): React.JSX.Element;
/**
 * Transform Yup ValidationError to a more usable object
 */
export declare function yupToFormErrors<Values>(yupError: any): FormikErrors<Values>;
/**
 * Validate a yup schema.
 */
export declare function validateYupSchema<T extends FormikValues>(values: T, schema: any, sync?: boolean, context?: any): Promise<Partial<T>>;
/**
 * Recursively prepare values.
 */
export declare function prepareDataForValidation<T extends FormikValues>(values: T): FormikValues;
