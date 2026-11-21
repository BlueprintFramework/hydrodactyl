import * as React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { FormikContextType } from './types';
/**
 * Connect any component to Formik context, and inject as a prop called `formik`;
 * @param Comp React Component
 */
export declare function connect<OuterProps, Values = {}>(Comp: React.ComponentType<OuterProps & {
    formik: FormikContextType<Values>;
}>): React.FC<OuterProps> & hoistNonReactStatics.NonReactStatics<React.ComponentClass<OuterProps & {
    formik: FormikContextType<Values>;
}, any>, {}>;
