import { BaseCaptchaProvider, type CaptchaRenderConfig } from '../CaptchaProvider';
import '../types';

type CapWidgetElement = HTMLElement & {
    tokenValue?: string;
    reset?: () => void;
};

export class CapProvider extends BaseCaptchaProvider {
    private static readonly SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@cap.js/widget';
    private loadPromise: Promise<void> | null = null;
    private widgetElements = new Map<string, CapWidgetElement>();
    private tokenByWidget = new Map<string, string>();
    private manualResets = new Set<string>();
    private nextWidgetId = 1;

    getName(): string {
        return 'cap';
    }

    getScriptUrls(): string[] {
        return [CapProvider.SCRIPT_URL];
    }

    getResponseFieldName(): string {
        return 'cap-token';
    }

    isLoaded(): boolean {
        return typeof customElements !== 'undefined' && customElements.get('cap-widget') !== undefined;
    }

    loadSdk(): Promise<void> {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        if (this.isLoaded()) {
            return Promise.resolve();
        }

        this.loadPromise = new Promise((resolve, reject) => {
            // Check if script is already in DOM
            const existingScript = document.querySelector(`script[src="${CapProvider.SCRIPT_URL}"]`);
            if (existingScript) {
                if (this.isLoaded()) {
                    resolve();
                    return;
                }
                // Wait for the existing script to define the widget
                customElements.whenDefined('cap-widget').then(
                    () => resolve(),
                    () => reject(new Error('Failed to load Cap widget SDK')),
                );
                existingScript.addEventListener('error', () => reject(new Error('Failed to load Cap widget SDK')));
                return;
            }

            const script = document.createElement('script');
            script.src = CapProvider.SCRIPT_URL;
            script.async = true;

            script.onload = () => {
                // The script defines the cap-widget custom element on execution
                customElements.whenDefined('cap-widget').then(
                    () => resolve(),
                    () => reject(new Error('Failed to load Cap widget SDK')),
                );
            };

            script.onerror = () => {
                reject(new Error('Failed to load Cap widget SDK'));
            };

            document.head.appendChild(script);
        });

        return this.loadPromise;
    }

    private static readonly DARK_THEME = {
        '--cap-background': 'var(--color-bg-raised)',
        '--cap-color': 'var(--color-cream-400)',
        '--cap-border-color': 'color-mix(in srgb, var(--color-cream-500) 10%, transparent)',
        '--cap-checkbox-background': 'color-mix(in srgb, var(--color-cream-500) 6%, transparent)',
        '--cap-checkbox-border': '1px solid color-mix(in srgb, var(--color-cream-500) 25%, transparent)',
        '--cap-spinner-color': 'var(--color-cream-400)',
        '--cap-spinner-background-color': 'color-mix(in srgb, var(--color-cream-500) 12%, transparent)',
        '--cap-focus-ring': 'var(--color-ring)',
        '--cap-troubleshoot-color': 'var(--color-ring)',
        '--cap-font': '"Plus Jakarta Sans", sans-serif',
    };

    private applyTheme(widget: CapWidgetElement, theme: CaptchaRenderConfig['theme']): void {
        const light =
            theme === 'light' ||
            (theme !== 'dark' && window.matchMedia?.('(prefers-color-scheme: light)').matches);

        if (light) {
            return;
        }

        for (const [property, value] of Object.entries(CapProvider.DARK_THEME)) {
            widget.style.setProperty(property, value);
        }
    }

    private applySize(widget: CapWidgetElement, size: CaptchaRenderConfig['size']): void {
        if (size === 'flexible') {
            // The widget is inline by default, which makes a 100% width
            // shrink to nothing — make it block-level so it can fill the form.
            widget.style.display = 'block';
            widget.style.width = '100%';
            widget.style.setProperty('--cap-widget-width', '100%');
        }
    }

    async render(container: HTMLElement, config: CaptchaRenderConfig): Promise<string> {
        await this.loadSdk();

        const widgetId = `cap-${this.nextWidgetId++}`;
        const widget = document.createElement('cap-widget') as CapWidgetElement;
        this.applyTheme(widget, config.theme);
        this.applySize(widget, config.size);
        const serverUrl = (config.serverUrl || window.SiteConfiguration?.captcha?.serverUrl || '').replace(/\/+$/, '');

        if (!serverUrl) {
            throw new Error('Cap server URL is not configured');
        }

        widget.setAttribute('data-cap-api-endpoint', `${serverUrl}/${config.siteKey}/`);

        // The widget has no 'expired' event, so we treat its own reset (when
        // the token gets too old) as expired. Resets we call ourselves are
        // skipped so they don't count as expired.
        let hadToken = false;

        widget.addEventListener('solve', (event) => {
            const token = (event as CustomEvent).detail?.token || widget.tokenValue || '';
            if (token) {
                hadToken = true;
                this.tokenByWidget.set(widgetId, token);
                config.onSuccess?.(token);
            }
        });
        widget.addEventListener('error', (event) => {
            // 'error' on HTMLElement is typed as ErrorEvent in the DOM lib, but the
            // cap-widget dispatches a CustomEvent here
            const detail = (event as unknown as CustomEvent).detail;
            config.onError?.(detail);
        });
        widget.addEventListener('reset', () => {
            if (hadToken && !this.manualResets.has(widgetId)) {
                config.onExpired?.();
            }
            hadToken = false;
            this.tokenByWidget.delete(widgetId);
        });

        container.appendChild(widget);
        this.widgetElements.set(widgetId, widget);

        return widgetId;
    }

    getResponse(widgetId?: string): string | null {
        if (!widgetId) {
            return null;
        }

        const widget = this.widgetElements.get(widgetId);

        if (!widget) {
            return null;
        }

        return this.tokenByWidget.get(widgetId) || widget.tokenValue || null;
    }

    reset(widgetId?: string): void {
        if (!widgetId) {
            return;
        }

        const widget = this.widgetElements.get(widgetId);
        if (widget) {
            this.manualResets.add(widgetId);
            widget.reset?.();
            this.manualResets.delete(widgetId);
        }
        this.tokenByWidget.delete(widgetId);
    }

    remove(widgetId?: string): void {
        if (!widgetId) {
            return;
        }

        const widget = this.widgetElements.get(widgetId);
        widget?.remove();
        this.widgetElements.delete(widgetId);
        this.tokenByWidget.delete(widgetId);
    }
}
