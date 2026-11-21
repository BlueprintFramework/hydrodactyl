export interface IScriptParams {
    scriptLocation?: HTMLElement;
    secureApi?: boolean;
    scriptSource?: string;
    apihost?: string;
    loadAsync?: boolean;
    cleanup?: boolean;
    query?: string;
    crossOrigin?: string;
    uj?: boolean;
}
export interface ILoaderParams extends IScriptParams {
    render?: 'explicit';
    sentry?: boolean;
    custom?: boolean;
    assethost?: string;
    imghost?: string;
    reportapi?: string;
    endpoint?: string;
    host?: string;
    recaptchacompat?: string;
    hl?: string;
    cleanup?: boolean;
    uj?: boolean;
    maxRetries?: number;
    retryDelay?: number;
}
export interface SentryHub {
    addBreadcrumb: (breadcrumb: object) => void;
    captureException: (error: any) => void;
    captureRequest: (context: RequestContext) => void;
}
export interface ScopeTag {
    key: string;
    value: string;
}
export interface BrowserContext {
    name: string;
    version: string;
}
export interface DeviceContext {
    device: string;
    model: string;
    family: string;
}
export interface RequestContext {
    method: string;
    url: string;
    headers?: string[];
}
