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

    async render(container: HTMLElement, config: CaptchaRenderConfig): Promise<string> {
        await this.loadSdk();

        const widgetId = `cap-${this.nextWidgetId++}`;
        const widget = document.createElement('cap-widget') as CapWidgetElement;
        const serverUrl = (config.serverUrl || window.SiteConfiguration?.captcha?.serverUrl || '').replace(/\/+$/, '');

        if (!serverUrl) {
            throw new Error('Cap server URL is not configured');
        }

        widget.setAttribute('data-cap-api-endpoint', `${serverUrl}/${config.siteKey}/`);
        widget.addEventListener('solve', (event) => {
            const token = (event as CustomEvent).detail?.token || widget.tokenValue || '';
            if (token) {
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
        widget?.reset?.();
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
