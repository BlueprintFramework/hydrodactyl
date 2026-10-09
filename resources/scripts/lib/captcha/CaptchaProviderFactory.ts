import type { CaptchaProviderInterface } from './CaptchaProvider';
import { CapProvider } from './providers/CapProvider';
import { HCaptchaProvider } from './providers/HCaptchaProvider';
import { NullProvider } from './providers/NullProvider';
import { RecaptchaProvider } from './providers/RecaptchaProvider';
import { TurnstileProvider } from './providers/TurnstileProvider';

const providers: Map<string, () => CaptchaProviderInterface> = new Map([
    ['turnstile', () => new TurnstileProvider()],
    ['hcaptcha', () => new HCaptchaProvider()],
    ['recaptcha', () => new RecaptchaProvider()],
    ['cap', () => new CapProvider()],
    ['none', () => new NullProvider()],
]);

function create(providerName: string): CaptchaProviderInterface {
    const providerFactory = providers.get(providerName);

    if (!providerFactory) {
        console.warn(`Unknown captcha provider: ${providerName}, falling back to null provider`);
        return new NullProvider();
    }

    return providerFactory();
}

function register(name: string, factory: () => CaptchaProviderInterface): void {
    providers.set(name, factory);
}

function getAvailableProviders(): string[] {
    return Array.from(providers.keys());
}

function hasProvider(name: string): boolean {
    return providers.has(name);
}

export const CaptchaProviderFactory = { create, register, getAvailableProviders, hasProvider };
