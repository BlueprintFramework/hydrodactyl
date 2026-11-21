import React from 'react';
import { Styled } from '../constructors/constructWithOptions';
import css from '../constructors/css';
import withTheme from '../hoc/withTheme';
import ThemeProvider, { ThemeConsumer, ThemeContext, useTheme } from '../models/ThemeProvider';
import { NativeTarget, RuleSet } from '../types';
import isStyledComponent from '../utils/isStyledComponent';
declare const reactNative: Awaited<typeof import("react-native")>;
/**
 * Create a styled component for React Native.
 *
 * ```tsx
 * const Card = styled.View`padding: 16px; background-color: white;`;
 * const Label = styled(Text)`font-size: 14px;`;
 * ```
 */
declare const baseStyled: <Target extends NativeTarget>(tag: Target) => Styled<"native", Target, Target extends import("../types").KnownTarget ? React.ComponentPropsWithRef<Target> : import("../types").BaseObject, import("../types").BaseObject, never>;
declare const aliases: readonly ["ActivityIndicator", "Button", "FlatList", "Image", "ImageBackground", "InputAccessoryView", "KeyboardAvoidingView", "Modal", "Pressable", "RefreshControl", "SafeAreaView", "ScrollView", "SectionList", "StatusBar", "Switch", "Text", "TextInput", "TouchableHighlight", "TouchableNativeFeedback", "TouchableOpacity", "TouchableWithoutFeedback", "View", "VirtualizedList"];
type KnownComponents = (typeof aliases)[number];
/** Isolates RN-provided components since they don't expose a helper type for this. */
type RNComponents = {
    [K in keyof typeof reactNative]: (typeof reactNative)[K] extends React.ComponentType<any> ? (typeof reactNative)[K] : never;
};
declare const styled: typeof baseStyled & { [E in KnownComponents]: Styled<"native", RNComponents[E], React.ComponentProps<RNComponents[E]>>; };
/**
 * Convert a `css` tagged template to a React Native StyleSheet object.
 *
 * ```tsx
 * const styles = toStyleSheet(css`background-color: red; padding: 10px;`);
 * // { backgroundColor: 'red', paddingTop: 10, ... }
 * ```
 */
declare const toStyleSheet: (rules: RuleSet<object>) => any;
export { CSSKeyframes, CSSObject, CSSProperties, CSSPseudos, DefaultTheme, ExecutionContext, ExecutionProps, IStyledComponent, IStyledComponentFactory, IStyledStatics, NativeTarget, PolymorphicComponent, PolymorphicComponentProps, Runtime, StyledObject, StyledOptions, } from '../types';
export { css, styled as default, isStyledComponent, styled, ThemeConsumer, ThemeContext, ThemeProvider, toStyleSheet, useTheme, withTheme, };
