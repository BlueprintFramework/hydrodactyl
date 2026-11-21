
//#region src/turnstile.d.ts
interface Turnstile$1 {
  /**
   * Registers a callback to be invoked when the turnstile is ready.
   * @param callback A callback function to be executed when the turnstile is ready. Use this callback to perform actions upon turnstile readiness.
   */
  ready: (callback: () => void) => void;
  /**
   * Invokes a Turnstile widget and returns the ID of the newly created widget.
   * @param container The HTML element to render the Turnstile widget into. Specify either the ID of HTML element (string), or the DOM element itself.
   * @param params An object containing render parameters as key=value pairs, for example, {"sitekey": "your_site_key", "theme": "auto"}.
   * @return the ID of the newly created widget, or undefined if invocation is unsuccessful.
   */
  render: (container: string | HTMLElement, params?: RenderParameters) => string | null | undefined;
  /**
   * Invokes a Turnstile widget and returns the ID of the newly created widget.
   * @param container The HTML element to render the Turnstile widget into. Specify either the ID of HTML element (string), or the DOM element itself.
   * @param params An object containing render parameters as key=value pairs, for example, {"sitekey": "your_site_key", "theme": "auto"}.
   * @return the ID of the newly created widget, or undefined if invocation is unsuccessful.
   */
  execute: (container: string | HTMLElement, params?: RenderParameters) => void;
  /**
   * Resets a Turnstile widget.
   * @param container The HTML element to render the Turnstile widget into. Specify either the ID of HTML element (string), or the DOM element itself.
   */
  reset: (container?: string | HTMLElement) => void;
  /**
   * Fully removes the Turnstile widget from the DOM.
   * @param container The HTML element to render the Turnstile widget into. Specify either the ID of HTML element (string), or the DOM element itself.
   */
  remove: (container?: string | HTMLElement) => void;
  /**
   * Gets the response of a Turnstile widget.
   * @param container The HTML element to render the Turnstile widget into. Specify either the ID of HTML element (string), or the DOM element itself.
   * @return the response of the Turnstile widget.
   */
  getResponse: (container?: string | HTMLElement) => string | undefined;
  /**
   * Checks whether or not the token returned by the given widget is expired.
   * @param container The HTML element to render the Turnstile widget into. Specify either the ID of HTML element (string), or the DOM element itself.
   * @return whether it is expired or not
   */
  isExpired: (container?: string | HTMLElement) => boolean;
}
/**
 * The theme of the Turnstile widget.
 * The default is "auto", which respects the user preference. This can be forced to "light" or "dark" by setting the theme accordingly.
 */
type Theme = "auto" | "light" | "dark";
/**
 * The widget size.
 * Can take the following values: normal, compact, flexible, invisible.
 */
type WidgetSize = "normal" | "compact" | "flexible" | "invisible";
/**
 * How to retry on widget failure.
 * The default is "auto", which allows the user to retry. This can be forced to "never" by the user.
 */
type FailureRetryMode = "never" | "auto";
/**
 * The appearance mode of the Turnstile widget.
 * The default is "always". If set to "execute", the widget will only appear when executing. If set to "interaction-only", the widget will only be shown when / if interactivity is required.
 */
type AppearanceMode = "always" | "execute" | "interaction-only";
/**
 * The refresh mode to use when the given Turnstile token expires.
 * The default is "auto". "never" will never refresh the widget, "manual" will prompt the user with a refresh button.
 */
type RefreshExpiredMode = "never" | "manual" | "auto";
/**
 * The refresh mode to use when the widget times out.
 * The default is "auto". "never" will never refresh the widget, "manual" will prompt the user with a refresh button.
 */
type RefreshTimeoutMode = "never" | "manual" | "auto";
/**
 * Execution controls when to obtain the token of the widget and can be on "render" (default) or on "execute".
 */
type ExecutionMode = "render" | "execute";
/**
 * Parameters for the turnstile.render() method.
 */
interface RenderParameters {
  /**
   * Your Cloudflare Turnstile sitekey. This sitekey is associated with the corresponding widget configuration and is created upon the widget creation.
   */
  sitekey: string;
  /**
   * Optional. A customer value that can be used to differentiate widgets under the same sitekey in analytics and which is returned upon validation.
   */
  action?: string | undefined;
  /**
   * Optional. A customer payload that can be used to attach customer data to the challenge throughout its issuance and which is returned upon validation.
   */
  cData?: string | undefined;
  /**
   * Optional. A JavaScript callback that is invoked upon success of the challenge.
   * The callback is passed a token that can be validated.
   */
  callback?: (token: string) => void;
  /**
   * Optional. A JavaScript callback that is invoked when a challenge expires.
   */
  "expired-callback"?: (token: string) => void;
  /**
   * Optional. A JavaScript callback invoked when there is an error (e.g. network error or the challenge failed).
   * Refer to [Client-side errors](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/).
   */
  "error-callback"?: ((error: string) => void) | undefined;
  /**
   * Optional. A JavaScript callback that is invoked when the Turnstile widget times out.
   */
  "timeout-callback"?: VoidFunction | undefined;
  /**
   * Optional. A JavaScript callback that is invoked before the user is prompted for interactivity.
   */
  "before-interactive-callback"?: VoidFunction | undefined;
  /**
   * Optional. A JavaScript callback that is invoked when the intneractive challenge has been solved.
   */
  "after-interactive-callback"?: VoidFunction | undefined;
  /**
   * Optional. A JavaScript callback that is invoked when the browser is not supported by Turnstile.
   */
  "unsupported-callback"?: VoidFunction | undefined;
  /**
   * Optional. The widget theme.
   * Accepted values: "auto", "light", "dark"
   * @see Theme
   * @default "auto"
   */
  theme?: Theme | undefined;
  /**
   * Optional. The tabindex of Turnstile’s iframe for accessibility purposes.
   * @default 0
   */
  tabindex?: number | undefined;
  /**
   * Optional. The size of the Turnstile widget.
   * Accepted values: "normal", "compact", "flexible", "invisible"
   * Note: "invisible" is only to be used with invisible widgets
   * @see WidgetSize
   * @default "normal"
   */
  size?: WidgetSize | undefined;
  /**
   * Optional. How to retry on widget failure.
   * Accepted values: "auto", "never"
   * @see FailureRetryMode
   * @default "auto"
   */
  retry?: FailureRetryMode | undefined;
  /**
   * Optional. Duration in milliseconds before the widget automatically retries.
   * @default 2000
   */
  "retry-interval"?: number | undefined;
  /**
   * Optional. The language picked by the customer (may not be supported).
   * This must be a valid ISO 639-1 country code, or "auto".
   * @default "auto"
   */
  language?: string | undefined;
  /**
   * Optional. The appearance mode of the widget.
   * @see AppearanceMode
   * @default "always"
   */
  appearance?: AppearanceMode | undefined;
  /**
   * Optional. Whether to add or not a hidden response input element with the turnstile token.
   * @default true
   */
  "response-field"?: boolean | undefined;
  /**
   * Optional. The name of the hidden input element added to the container where Turnstile is injected.
   * @default "cf-turnstile-response"
   */
  "response-field-name"?: string | undefined;
  /**
   * Optional.
   * @see RefreshExpiredMode
   * @default "auto"
   */
  "refresh-expired"?: RefreshExpiredMode | undefined;
  /**
   * Optional.
   * @see RefreshTimeoutMode
   * @default "auto"
   */
  "refresh-timeout"?: RefreshTimeoutMode | undefined;
  /**
   * Optional.
   * @see ExecutionMode
   * @default "render"
   */
  execution?: ExecutionMode | undefined;
  /**
   * Optional. Allows Cloudflare to gather visitor feedback upon widget failure.
   * @default true
   */
  "feedback-enabled"?: boolean | undefined;
}
//#endregion
//#region src/types.d.ts
declare global {
  interface Window {
    turnstile?: Turnstile$1;
  }
}
/** React Turnstile instance to use with the `useRef` hook. */
interface TurnstileInstance extends Omit<Turnstile$1, "ready"> {
  /**
   * Explicitly render the Turnstile widget.
   * @returns The rendered widget ID.
   */
  render: () => ReturnType<Turnstile$1["render"]>;
  /** Render a widget when `options.execution` is set to `'execute'`. This method should be called after the `.render()` method. If `options.execution` is set to `'render'` this method has no effect. */
  execute: () => ReturnType<Turnstile$1["execute"]>;
  /** Resets the Turnstile widget. */
  reset: () => ReturnType<Turnstile$1["reset"]>;
  /** Fully removes the Turnstile widget from the DOM. */
  remove: () => ReturnType<Turnstile$1["remove"]>;
  /**
   * Gets the response of a Turnstile widget.
   * @returns The token response.
   */
  getResponse: () => ReturnType<Turnstile$1["getResponse"]>;
  /**
   *  Gets the response of a Turnstile widget as a promise, it waits until the widget is rendered and solved.
   * @param timeout - Optional. Timeout in milliseconds. Default to 30000.
   * @param retry - Optional. Retry interval in milliseconds. Default to 250.
   * @returns A promise that resolves with the token response.
   */
  getResponsePromise: (timeout?: number, retry?: number) => Promise<Exclude<ReturnType<Turnstile$1["getResponse"]>, undefined>>;
  /** Checks whether or not the token returned by the given widget is expired. */
  isExpired: () => ReturnType<Turnstile$1["isExpired"]>;
}
/** Render options or parameters for the `<Turnstile />` component. */
interface ComponentRenderOptions extends Pick<RenderParameters, "action" | "cData" | "theme" | "retry" | "language" | "execution" | "appearance"> {
  /**
   * The tabindex of Turnstile’s iframe for accessibility purposes.
   * @default 0
   */
  tabIndex?: RenderParameters["tabindex"];
  /**
   * Whether to add or not a hidden response input element with the turnstile token.
   * @default true
   */
  responseField?: RenderParameters["response-field"];
  /**
   * The name of the hidden input element added to the container where Turnstile is injected.
   * @default "cf-turnstile-response"
   */
  responseFieldName?: RenderParameters["response-field-name"];
  /**
   * Duration in milliseconds before the widget automatically retries.
   * @default 8000
   */
  retryInterval?: RenderParameters["retry-interval"];
  /**
   * The size of the Turnstile widget.
   * Accepted values: "normal", "compact", "flexible", "invisible".
   * Normal: 300x65px, compact: 150x140px, flexible: 100% width (min: 300px) x 65px.
   * Invisible will show no widget and is only to be used with invisible type widgets.
   * @default "normal"
   */
  size?: WidgetSize;
  /**
   * The refresh mode to use when the given Turnstile token expires.
   * The default is "auto". "never" will never refresh the widget, "manual" will prompt the user with a refresh button.
   * @default "auto"
   */
  refreshExpired?: RenderParameters["refresh-expired"];
  /**
   * The refresh mode to use when the widget times out.
   * The default is "auto". "never" will never refresh the widget, "manual" will prompt the user with a refresh button.
   * @default "auto"
   */
  refreshTimeout?: RenderParameters["refresh-timeout"];
  /**
   * Allows Cloudflare to gather visitor feedback upon widget failure.
   * @default true
   */
  feedbackEnabled?: RenderParameters["feedback-enabled"];
}
/** Custom options for the injected script. */
interface ScriptOptions {
  /**
   * Custom nonce for the injected script.
   * @default undefined
   */
  nonce?: string;
  /**
   * Define if set the injected script as defer.
   * @default true
   */
  defer?: boolean;
  /**
   * Define if set the injected script as async.
   * @default true
   */
  async?: boolean;
  /**
   * Define if inject the script in the head or in the body.
   * @default "head"
   */
  appendTo?: "head" | "body";
  /**
   * Custom ID of the injected script.
   * @default "cf-turnstile-script"
   */
  id?: string;
  /**
   * Custom name of the onload callback.
   * @default "onloadTurnstileCallback"
   */
  onLoadCallbackName?: string;
  /** Callback invoked when script fails to load (e.g. Cloudflare has an outage). */
  onError?: () => void;
  /**
   * Custom crossOrigin for the injected script.
   * @default undefined
   */
  crossOrigin?: string;
}
/** `<Turnstile />` component props */
interface TurnstileProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onError"> {
  /** Your Cloudflare Turnstile sitekey. This sitekey is associated with the corresponding widget configuration and is created upon the widget creation. */
  siteKey: RenderParameters["sitekey"];
  /** Callback invoked after a successful render of the widget. The callback is passed the widget ID. It does not trigger when the widget is reset. */
  onWidgetLoad?: (widgetID: string) => void;
  /**
   * Callback that is invoked upon success of the challenge.
   * The callback is passed a token that can be validated.
   */
  onSuccess?: RenderParameters["callback"];
  /** Callback that is invoked when a challenge expires. */
  onExpire?: RenderParameters["expired-callback"];
  /**
   * Callback invoked when there is an error (e.g. network error or the challenge failed). The callback is passed an error code.
   * Refer to [Client-side errors](https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/).
   */
  onError?: RenderParameters["error-callback"];
  /** Callback that is invoked before the user is prompted for interactivity. */
  onBeforeInteractive?: RenderParameters["before-interactive-callback"];
  /** Callback that is invoked when the interactive challenge has been solved. */
  onAfterInteractive?: RenderParameters["after-interactive-callback"];
  /** Callback that is invoked when the browser is not supported by Turnstile. */
  onUnsupported?: RenderParameters["unsupported-callback"];
  /** Callback that is invoked when the Turnstile widget times out. */
  onTimeout?: RenderParameters["timeout-callback"];
  /**
   * Custom widget render options. See {@link https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#configurations the docs} for more info.
   */
  options?: ComponentRenderOptions;
  /**
   * Custom injected script options.
   */
  scriptOptions?: ScriptOptions;
  /** Define the HTML tag of the widget container. Default to `'div'`. */
  as?: React.ElementType;
  /**
   * Controls if the script is automatically injected or not. If you want to inject the script manually, set this property to `false`.
   * @default true
   */
  injectScript?: boolean;
  /** Callback that is invoked when the script is loaded. */
  onLoadScript?: () => void;
  /**
   * Controls whether the widget re-renders when callback props change.
   *
   * - `false` (default): Stable callbacks - better performance, callbacks don't cause widget re-renders
   * - `true`: Dynamic callbacks - widget re-renders when callbacks change, useful for intentional callback updates
   *
   * **Important:** When set to `true`, wrap your callback functions with `useCallback` to prevent
   * unnecessary widget re-renders on every parent component re-render.
   *
   * @example
   * ```tsx
   * const handleSuccess = useCallback((token) => {
   *   console.log('Success:', token)
   * }, [])
   *
   * <Turnstile
   *   rerenderOnCallbackChange={true}
   *   onSuccess={handleSuccess}
   * />
   * ```
   *
   * @default false
   */
  rerenderOnCallbackChange?: boolean;
}
/**
 * Some language that are supported by Cloudflare Turnstile.
 * See {@link https://developers.cloudflare.com/turnstile/reference/supported-languages/} for more info.
 */
type TurnstileLangCode = "ar" | "ar-EG" | "cs" | "da" | "de" | "el" | "en" | "es" | "fa" | "fi" | "fr" | "he" | "hi" | "hr" | "hu" | "id" | "it" | "ja" | "ko" | "lt" | "nl" | "ms" | "nb" | "pl" | "pt" | "pt-BR" | "ro" | "ru" | "sk" | "sl" | "sr" | "sv" | "th" | "tl" | "tlh" | "tr" | "uk" | "zh" | "zh-CN" | "zh-TW" | (string & {});
/**
 * Server-side validation response from Cloudflare Turnstile.
 * See {@link https://developers.cloudflare.com/turnstile/get-started/server-side-validation the docs} for more info.
 */
interface TurnstileServerValidationResponse {
  /** Indicate if the token validation was successful or not. */
  success: boolean;
  /** A list of errors that occurred. */
  "error-codes": TurnstileServerValidationErrorCode[];
  /** The ISO timestamp for the time the challenge was solved. */
  challenge_ts?: string;
  /** The hostname for which the challenge was served. */
  hostname?: string;
  /** The customer widget identifier passed to the widget on the client side. This is used to differentiate widgets using the same sitekey in analytics. Its integrity is protected by modifications from an attacker. It is recommended to validate that the action matches an expected value. */
  action?: string;
  /** The customer data passed to the widget on the client side. This can be used by the customer to convey state. It is integrity protected by modifications from an attacker. */
  cdata?: string;
  /** Whether or not an interactive challenge was issued by Cloudflare */
  metadata?: {
    interactive: boolean;
  };
  /** Error messages returned */
  messages?: string[];
}
/**
 * Error codes returned by Cloudflare Turnstile server-side validation.
 * See {@link https://developers.cloudflare.com/turnstile/get-started/server-side-validation/#error-codes the docs} for more info.
 */
type TurnstileServerValidationErrorCode = /**  The secret parameter was not passed. */"missing-input-secret" /**  The secret parameter was invalid or did not exist. */ | "invalid-input-secret" /**  The response parameter was not passed. */ | "missing-input-response" /**  The response parameter is invalid or has expired. */ | "invalid-input-response" /**  The widget ID extracted from the parsed site secret key was invalid or did not exist. */ | "invalid-widget-id" /**  The secret extracted from the parsed site secret key was invalid. */ | "invalid-parsed-secret" /**  The request was rejected because it was malformed. */ | "bad-request" /**  The response parameter has already been validated before. */ | "timeout-or-duplicate" /**  An internal error happened while validating the response. The request can be retried. */ | "internal-error";
//#endregion
//#region src/lib.d.ts
declare const Turnstile: import("react").ForwardRefExoticComponent<TurnstileProps & import("react").RefAttributes<TurnstileInstance | undefined>>;
//#endregion
//#region src/utils.d.ts
declare const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";
declare const DEFAULT_SCRIPT_ID = "cf-turnstile-script";
declare const DEFAULT_CONTAINER_ID = "cf-turnstile";
declare const DEFAULT_ONLOAD_NAME = "onloadTurnstileCallback";
//#endregion
export { type AppearanceMode, DEFAULT_CONTAINER_ID, DEFAULT_ONLOAD_NAME, DEFAULT_SCRIPT_ID, type ExecutionMode, type FailureRetryMode, type RefreshExpiredMode, type RefreshTimeoutMode, SCRIPT_URL, Turnstile, type TurnstileInstance, type TurnstileLangCode, type TurnstileProps, type TurnstileServerValidationErrorCode, type TurnstileServerValidationResponse, type Theme as TurnstileTheme, type WidgetSize };