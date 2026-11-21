import { Attrs, BaseObject, ExecutionProps, Interpolation, IStyledComponent, IStyledComponentFactory, KnownTarget, MakeAttrsOptional, Runtime, StyledOptions, StyledTarget, Styles, Substitute, WidenUntypedProps } from '../types';
type AttrsResult<T extends Attrs<any>> = T extends (...args: any) => infer P ? P extends object ? P : never : T extends object ? T : never;
/**
 * Based on Attrs being a simple object or function that returns
 * a prop object, inspect the attrs result and attempt to extract
 * any "as" prop usage to modify the runtime target.
 */
type AttrsTarget<R extends Runtime, T extends Attrs<any>, FallbackTarget extends StyledTarget<R>, Result extends ExecutionProps = AttrsResult<T>> = Result extends {
    as: infer RuntimeTarget;
} ? RuntimeTarget extends KnownTarget ? RuntimeTarget : FallbackTarget : FallbackTarget;
export interface Styled<out R extends Runtime, out Target extends StyledTarget<R>, in out OuterProps extends object, out OuterStatics extends object = BaseObject, out AttrsKeys extends keyof any = never> {
    <Props extends object = BaseObject, Statics extends object = BaseObject>(initialStyles: Styles<Substitute<OuterProps, NoInfer<Props>>>, ...interpolations: Interpolation<Substitute<OuterProps, NoInfer<Props>>>[]): IStyledComponent<R, MakeAttrsOptional<Substitute<OuterProps, Props>, AttrsKeys>> & OuterStatics & Statics & (R extends 'web' ? Target extends string ? {} : Omit<Target, keyof React.Component<any>> : {});
    attrs: <Props extends object = BaseObject, PrivateMergedProps extends object = Substitute<OuterProps, Props>, PrivateAttrsArg extends Attrs<WidenUntypedProps<PrivateMergedProps>> = Attrs<WidenUntypedProps<PrivateMergedProps>>, PrivateResolvedTarget extends StyledTarget<R> = AttrsTarget<R, PrivateAttrsArg, Target>>(attrs: PrivateAttrsArg) => Styled<R, PrivateResolvedTarget, PrivateResolvedTarget extends KnownTarget ? Substitute<Substitute<OuterProps, React.ComponentPropsWithRef<PrivateResolvedTarget>>, Props> : PrivateMergedProps, OuterStatics, AttrsKeys | keyof AttrsResult<PrivateAttrsArg>>;
    withConfig: (config: StyledOptions<R, OuterProps>) => Styled<R, Target, OuterProps, OuterStatics, AttrsKeys>;
}
export default function constructWithOptions<R extends Runtime, Target extends StyledTarget<R>, OuterProps extends object = Target extends KnownTarget ? React.ComponentPropsWithRef<Target> : BaseObject, OuterStatics extends object = BaseObject, AttrsKeys extends keyof any = never>(componentConstructor: IStyledComponentFactory<R, StyledTarget<R>, object, any>, tag: StyledTarget<R>, options?: StyledOptions<R, OuterProps>): Styled<R, Target, OuterProps, OuterStatics, AttrsKeys>;
export {};
