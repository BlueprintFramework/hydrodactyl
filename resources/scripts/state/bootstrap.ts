import { store } from '@/state';
import type { SiteSettings } from '@/state/settings';

export interface ExtendedWindow extends Window {
    SiteConfiguration?: SiteSettings;
    SetupRequired?: boolean;
    HydrodactylUser?: {
        uuid: string;
        username: string;
        email: string;

        root_admin: boolean;
        use_totp: boolean;
        language: string;
        updated_at: string;
        created_at: string;
    };
}

/**
 * Seed the store with the values the backend injected into the page. Both
 * entry points (panel and admin dashboard) must call this before rendering so
 * the user language and the site configuration are available on first paint.
 */
export function hydrateStore(): void {
    const { HydrodactylUser, SiteConfiguration } = window as ExtendedWindow;

    if (HydrodactylUser && !store.getState().user.data) {
        store.getActions().user.setUserData({
            uuid: HydrodactylUser.uuid,
            username: HydrodactylUser.username,
            email: HydrodactylUser.email,
            language: HydrodactylUser.language,
            rootAdmin: HydrodactylUser.root_admin,
            useTotp: HydrodactylUser.use_totp,
            createdAt: new Date(HydrodactylUser.created_at),
            updatedAt: new Date(HydrodactylUser.updated_at),
        });
    }

    if (!store.getState().settings.data && SiteConfiguration) {
        store.getActions().settings.setSettings(SiteConfiguration);
    }
}
