// Global type definitions for captcha providers
declare global {
    interface Window {
        SiteConfiguration?: {
            name: string;
            locale: string;
            timezone: string;
            logo?: string | null;
            captcha: {
                enabled: boolean;
                provider: string;
                siteKey: string;
                serverUrl?: string;
                scriptIncludes: string[];
            };
        };
        turnstile?: {
            render: (container: string | HTMLElement, params: Record<string, unknown>) => string;
            reset: (widgetId?: string) => void;
            getResponse: (widgetId?: string) => string;
            remove: (widgetId?: string) => void;
        };
        hcaptcha?: {
            render: (container: string | HTMLElement, params: Record<string, unknown>) => string;
            reset: (widgetId?: string) => void;
            getResponse: (widgetId?: string) => string;
            remove: (widgetId?: string) => void;
        };
        grecaptcha?: {
            render: (container: string | HTMLElement, options: Record<string, unknown>) => number;
            getResponse: (widgetId?: number) => string;
            reset: (widgetId?: number) => void;
            execute: (siteKey: string, options?: { action: string }) => Promise<string>;
            ready: (callback: () => void) => void;
        };
    }
}

export {};
