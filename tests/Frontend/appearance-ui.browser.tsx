import '@/assets/tailwind.css';
import { EditorView } from '@codemirror/view';
import { type AxiosAdapter, AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { createStore, StoreProvider } from 'easy-peasy';
import { act, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { updateLogo } from '@/api/admin/logo';
import http from '@/api/http';
import GlobalStylesheet from '@/assets/css/GlobalStylesheet';
import AppearanceToaster from '@/components/AppearanceToaster';
import BrandingSettings from '@/components/admin/settings/BrandingSettings';
import AppearanceSettings from '@/components/dashboard/AppearanceSettings';
import ContentBox from '@/components/elements/ContentBox';
import Editor from '@/components/elements/editor/Editor';
import Input from '@/components/elements/Input';
import AppHeader from '@/components/layout/header/AppHeader';
import ThemeToggle from '@/components/layout/header/ThemeToggle';
import Console from '@/components/server/console/Console';
import { SocketEvent } from '@/components/server/events';
import { Button } from '@/components/ui/button';
import { AppearanceProvider, useAppearance } from '@/contexts/AppearanceContext';
import { HeaderProvider, useHeader } from '@/contexts/HeaderContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { appearanceAccents, appearancePalettes, appearanceStorageKey } from '@/lib/appearance';
import { Websocket } from '@/plugins/Websocket';
import { ServerContext } from '@/state/server';
import userModel from '@/state/user';

// Run with Vite, then open /tests/Frontend/appearance-ui.html. No backend or test dependencies required.
const results: string[] = [];
type BrandingRequest = { method: string; url: string; data?: unknown };
type FixturePostBehavior = 'success' | '422' | '500' | 'deferred';

const originalHttpAdapter = http.defaults.adapter;
const brandingFixture = {
    requests: [] as BrandingRequest[],
    postCount: 0,
    postBehavior: 'success' as FixturePostBehavior,
    releasePost: undefined as (() => void) | undefined,
    responseBrandColor: undefined as string | undefined,
    response: {
        type: null as string | null,
        value: null as string | null,
        url: null as string | null,
        history: [] as Array<{ type: string; value: string; url: string; current: boolean }>,
        brandColor: '#123456',
        defaultBrandColor: '#ABCDEF',
        canProcessImages: true,
    },
};

const createBrandingFixtureAdapter =
    (requests: BrandingRequest[]): AxiosAdapter =>
    async (config) => {
        const method = (config.method ?? 'get').toLowerCase();
        const url = config.url ?? '';
        const request = { method, url, data: config.data };
        requests.push(request);
        if (url !== '/admin/api/settings/logo' || (method !== 'get' && method !== 'post')) {
            throw new AxiosError(
                `Unexpected fixture request: ${method.toUpperCase()} ${url}`,
                'ERR_BAD_REQUEST',
                config,
            );
        }
        const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        request.data = data;

        if (method === 'post') {
            brandingFixture.postCount++;
            if (brandingFixture.postBehavior === 'deferred') {
                await new Promise<void>((resolve) => {
                    brandingFixture.releasePost = resolve;
                });
                brandingFixture.releasePost = undefined;
            }
            if (brandingFixture.postBehavior === '422' || brandingFixture.postBehavior === '500') {
                const status = Number(brandingFixture.postBehavior);
                const response = {
                    data: { message: `Fixture HTTP ${status}` },
                    status,
                    statusText: 'Fixture Error',
                    headers: new AxiosHeaders(),
                    config,
                    request: { url },
                };
                throw new AxiosError(`Fixture HTTP ${status}`, 'ERR_BAD_RESPONSE', config, response.request, response);
            }
            const color = (data as Record<string, unknown> | undefined)?.['app:brand_color'];
            if (color === null) brandingFixture.response.brandColor = brandingFixture.response.defaultBrandColor;
            else if (typeof color === 'string') brandingFixture.response.brandColor = color;
            if (brandingFixture.responseBrandColor !== undefined) {
                brandingFixture.response.brandColor = brandingFixture.responseBrandColor;
            }
        }

        return {
            data: brandingFixture.response,
            status: 200,
            statusText: 'OK',
            headers: new AxiosHeaders(),
            config,
            request: { url },
        };
    };

const appearanceSWRConfig = { provider: () => new Map(), revalidateOnFocus: false };
const headerStore = createStore({ user: userModel });
headerStore.getActions().user.setUserData({
    uuid: 'appearance-fixture-user',
    username: 'Appearance Fixture',
    email: 'appearance.fixture.user.with.a.long.address@example.test',
    language: 'en',
    rootAdmin: true,
    useTotp: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
});
Object.assign(globalThis, { __appearanceBrandingFixture: brandingFixture });
const root = document.getElementById('appearance-test-root');
const output = document.getElementById('test-results');
if (!root || !output) throw new Error('Test page is missing its containers');
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
document.documentElement.style.setProperty('--brand-color', '#52a9ff');

function assert(condition: unknown, description: string): asserts condition {
    if (!condition) throw new Error(description);
    results.push(description);
}

const media = new EventTarget();
let systemDark = false;
const originalMatchMedia = window.matchMedia;
window.matchMedia = ((query: string) =>
    query === '(prefers-color-scheme: dark)'
        ? media
        : originalMatchMedia.call(window, query)) as typeof window.matchMedia;
Object.defineProperty(media, 'matches', { get: () => systemDark, configurable: true });

let getContent: (() => Promise<string>) | undefined;
let mountCount = 0;
let rerenderThemeToggle: (() => void) | undefined;
type HeaderScenario = 'client-legacy' | 'client-slotted' | 'admin-legacy' | 'admin-slotted';
let setHeaderScenario: ((scenario: HeaderScenario) => void) | undefined;
const consoleSocket = new Websocket();
function ConsoleFixture() {
    const actions = ServerContext.useStoreActions((state) => state);
    useEffect(() => {
        actions.socket.setInstance(consoleSocket);
        actions.socket.setConnectionState(true);
        actions.server.setPermissions(['control.console']);
    }, [actions]);
    return <Console />;
}
function MountProbe() {
    // The initializer runs only on mount: changing theme must preserve child state.
    const [instance] = useState(() => ++mountCount);
    const { theme } = useAppearance();
    return <span data-mount={instance} data-resolved-theme={theme} />;
}

function ThemeToggleFixture() {
    const [, setRevision] = useState(0);
    rerenderThemeToggle = () => setRevision((revision) => revision + 1);
    return <ThemeToggle />;
}

function HeaderPreview() {
    const [scenario, changeScenario] = useState<HeaderScenario>('client-legacy');
    const { clearHeaderActions, setHeaderActions, setLeftActions, setCenterActions, setRightActions } = useHeader();
    setHeaderScenario = changeScenario;

    useEffect(() => {
        clearHeaderActions();
        if (scenario.endsWith('slotted')) {
            setLeftActions(
                <Button data-header-action='left' size='sm'>
                    Left action
                </Button>,
            );
            setCenterActions(<span data-header-action='center'>Server details</span>);
            setRightActions(
                <Button data-header-action='right' size='sm'>
                    Long custom server action
                </Button>,
            );
        } else {
            setHeaderActions(<Button data-header-action='legacy'>Console actions</Button>);
        }
    }, [scenario, clearHeaderActions, setHeaderActions, setLeftActions, setCenterActions, setRightActions]);

    return <AppHeader admin={scenario.startsWith('admin')} />;
}

function AppHeaderFixture() {
    return (
        <div id='app-header-fixture' className='w-full'>
            <MemoryRouter>
                <StoreProvider store={headerStore}>
                    <SidebarProvider>
                        <HeaderProvider>
                            <HeaderPreview />
                        </HeaderProvider>
                    </SidebarProvider>
                </StoreProvider>
            </MemoryRouter>
        </div>
    );
}

function MountThemeToggleAfterStorageFailure() {
    const { persistent, updateAppearance } = useAppearance();
    const [ready, setReady] = useState(false);
    const attempted = useRef(false);
    useEffect(() => {
        if (attempted.current) return;
        attempted.current = true;
        updateAppearance({ mode: 'light' });
        setReady(true);
    }, [updateAppearance]);
    return ready ? (
        <div data-toggle-persistent={persistent}>
            <ThemeToggle />
        </div>
    ) : null;
}

function Preview() {
    return (
        <AppearanceProvider>
            <GlobalStylesheet />
            <style>{'* { transition: none !important; animation: none !important; }'}</style>
            <AppearanceToaster />
            <AppHeaderFixture />
            <ThemeToggleFixture />
            <main className='h-dvh overflow-auto bg-bg p-4 text-primary sm:p-8'>
                <div className='mx-auto max-w-3xl space-y-4'>
                    <h1 className='text-2xl font-bold'>Appearance regression tests</h1>
                    <AppearanceSettings />
                    <ContentBox title='Branding controls fixture'>
                        <BrandingSettings />
                    </ContentBox>
                    <ContentBox title='Shared components'>
                        <label htmlFor='preview-input' className='text-secondary'>
                            Input
                        </label>
                        <Input id='preview-input' defaultValue='Unsaved input' className='mb-4 block w-full' />
                        <Button type='button'>Primary action</Button>{' '}
                        <Button type='button' variant='secondary'>
                            Secondary action
                        </Button>
                        <Button type='button' variant='attention'>
                            Attention action
                        </Button>
                        <p className='mt-4 text-hydro-400'>Selected accent</p>
                        <p className='text-cream-400/50' data-muted-probe>
                            Muted label
                        </p>
                        <p className='text-red-400'>Error status</p>
                        <Button type='button' className='mt-2 bg-hydro-500 text-mocha-500'>
                            Accent action
                        </Button>
                    </ContentBox>
                    <ContentBox title='Editor'>
                        <div className='h-40 overflow-hidden rounded-lg border border-mocha-300'>
                            <Editor
                                initialContent='server-port=25565'
                                filename='server.txt'
                                fetchContent={(callback) => {
                                    getContent = callback;
                                }}
                            />
                        </div>
                    </ContentBox>
                    <ContentBox title='Console'>
                        <SidebarProvider>
                            <ServerContext.Provider>
                                <ConsoleFixture />
                            </ServerContext.Provider>
                        </SidebarProvider>
                    </ContentBox>
                    <MountProbe />
                </div>
            </main>
        </AppearanceProvider>
    );
}

async function change(name: string, value: string) {
    const radio = document.querySelector<HTMLInputElement>(`input[type="radio"][name="${name}"][value="${value}"]`);
    if (!radio) throw new Error(`Missing radio for ${name}=${value}`);
    await act(async () => radio.click());
}

async function clickThemeToggle() {
    const button = document.querySelector<HTMLButtonElement>('button[aria-label^="Switch to "]');
    if (!button) throw new Error('Missing theme toggle button');
    await act(async () => button.click());
}

async function switchHeaderScenario(scenario: HeaderScenario) {
    if (!setHeaderScenario) throw new Error('AppHeader fixture did not mount');
    await act(async () => setHeaderScenario?.(scenario));
}

async function verifyHeaderScenario(scenario: HeaderScenario, width: number) {
    const header = document.querySelector<HTMLElement>('#app-header-fixture');
    if (!header) throw new Error('AppHeader fixture did not mount');
    const originalWidth = header.style.width;
    header.style.width = `${width}px`;
    try {
        const themeToggles = header.querySelectorAll<HTMLButtonElement>('button[aria-label^="Switch to "]');
        const accountMenus = header.querySelectorAll<HTMLButtonElement>('button[aria-label="Account menu"]');
        const actionButtons = header.querySelectorAll<HTMLButtonElement>('[data-header-action]');
        const actions = header.querySelectorAll<HTMLElement>('[data-header-action]');
        const expectedActionCount = scenario.endsWith('slotted') ? 3 : 1;
        assert(themeToggles.length === 1, `${scenario}/${width}px: AppHeader has one theme toggle`);
        assert(accountMenus.length === 1, `${scenario}/${width}px: AppHeader retains one account menu`);
        assert(
            Boolean(
                themeToggles.item(0).compareDocumentPosition(accountMenus.item(0)) & Node.DOCUMENT_POSITION_FOLLOWING,
            ),
            `${scenario}/${width}px: theme toggle precedes the account menu`,
        );
        assert(actions.length === expectedActionCount, `${scenario}/${width}px: AppHeader preserves its actions`);
        const headerBounds = header.getBoundingClientRect();
        const controls = [...themeToggles, ...accountMenus, ...actionButtons];
        assert(
            controls.every((control) => {
                const rect = control.getBoundingClientRect();
                return (
                    control.getClientRects().length > 0 &&
                    rect.left >= headerBounds.left &&
                    rect.right <= headerBounds.right &&
                    rect.width > 0 &&
                    rect.height > 0
                );
            }),
            `${scenario}/${width}px: theme, account and action controls remain within the header`,
        );
        const toggleBounds = themeToggles.item(0).getBoundingClientRect();
        assert(
            toggleBounds.width >= 44 && toggleBounds.height >= 44,
            `${scenario}/${width}px: integrated theme toggle keeps its 44px target`,
        );
        const clippingIssues = controls.flatMap((control) => {
            const rect = control.getBoundingClientRect();
            const name = control.getAttribute('aria-label') ?? control.getAttribute('data-header-action');
            const issues: string[] = [];
            for (
                let ancestor = control.parentElement;
                ancestor && ancestor !== header;
                ancestor = ancestor.parentElement
            ) {
                const style = getComputedStyle(ancestor);
                const bounds = ancestor.getBoundingClientRect();
                const left = bounds.left + ancestor.clientLeft;
                const top = bounds.top + ancestor.clientTop;
                if (
                    (style.overflowX === 'hidden' || style.overflowX === 'clip') &&
                    (rect.left < left - 1 || rect.right > left + ancestor.clientWidth + 1)
                ) {
                    issues.push(`${name}: x=${rect.left}-${rect.right}, clip=${left}-${left + ancestor.clientWidth}`);
                }
                if (
                    (style.overflowY === 'hidden' || style.overflowY === 'clip') &&
                    (rect.top < top - 1 || rect.bottom > top + ancestor.clientHeight + 1)
                ) {
                    issues.push(`${name}: y=${rect.top}-${rect.bottom}, clip=${top}-${top + ancestor.clientHeight}`);
                }
            }
            return issues;
        });
        assert(
            clippingIssues.length === 0,
            `${scenario}/${width}px: controls stay inside every clipping ancestor${clippingIssues.length ? ` (${clippingIssues.join('; ')})` : ''}`,
        );
        const controlBounds = controls.map((control) => {
            const { left, right, top, bottom } = control.getBoundingClientRect();
            return `${control.getAttribute('aria-label') ?? control.getAttribute('data-header-action')}: ${left}-${right} × ${top}-${bottom}`;
        });
        assert(
            controls.every((control, index) =>
                controls.slice(index + 1).every((other) => {
                    const rect = control.getBoundingClientRect();
                    const otherRect = other.getBoundingClientRect();
                    return (
                        rect.right <= otherRect.left ||
                        otherRect.right <= rect.left ||
                        rect.bottom <= otherRect.top ||
                        otherRect.bottom <= rect.top
                    );
                }),
            ),
            `${scenario}/${width}px: header controls do not overlap${controlBounds ? ` (${controlBounds.join('; ')})` : ''}`,
        );
        assert(
            [...actions].every((action) => action.scrollWidth <= action.clientWidth),
            `${scenario}/${width}px: custom action labels are not clipped`,
        );
        const account = accountMenus.item(0);
        const panelAction = scenario.startsWith('admin') ? 'Client Panel' : 'Admin Panel';
        await act(async () =>
            account.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, ctrlKey: false })),
        );
        const menuItems = [...(document.querySelector('[role="menu"]')?.querySelectorAll('[role="menuitem"]') ?? [])];
        assert(
            account.getAttribute('aria-expanded') === 'true' &&
                menuItems.some((item) => item.textContent?.includes('Settings')) &&
                menuItems.some((item) => item.textContent?.includes(panelAction)) &&
                menuItems.some((item) => item.textContent?.includes('Log Out')),
            `${scenario}/${width}px: seeded account menu opens with its expected actions${account.getAttribute('aria-expanded') !== 'true' || menuItems.length === 0 ? ` (expanded=${account.getAttribute('aria-expanded')}, items=${menuItems.map((item) => item.textContent?.trim()).join('|')})` : ''}`,
        );
        await act(async () => account.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
        assert(account.getAttribute('aria-expanded') === 'false', `${scenario}/${width}px: account menu closes`);
    } finally {
        header.style.width = originalWidth;
    }
}

function verifyThemeToggle(theme: 'light' | 'dark') {
    const button = document.querySelector<HTMLButtonElement>('button[aria-label^="Switch to "]');
    if (!button) throw new Error('Missing theme toggle button');
    const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    const target = button.getBoundingClientRect();
    const saved = JSON.parse(localStorage.getItem(appearanceStorageKey) ?? '{}') as Record<string, unknown>;
    assert(
        document.documentElement.dataset.theme === theme &&
            button.getAttribute('aria-label') === label &&
            button.dataset.icon === (theme === 'dark' ? 'sun' : 'moon') &&
            target.width >= 44 &&
            target.height >= 44,
        `${theme}: toggle shows the next action, matching icon and 44px target`,
    );
    assert(saved.mode === theme, `${theme}: toggle saves an explicit mode`);
}

function storageWarningToasts() {
    return Array.from(document.querySelectorAll('[data-sonner-toast]')).filter((toast) =>
        toast.textContent?.includes(
            'Browser storage is unavailable. Your selection will last until you reload this page.',
        ),
    );
}

function setInputValue(input: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
}

async function verifyBrandColorForm() {
    const picker = document.querySelector<HTMLInputElement>('#brand-color-picker');
    const hex = document.querySelector<HTMLInputElement>('#brand-color-hex');
    const save = [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('Save Color'));
    const reset = [...document.querySelectorAll('button')].find((button) =>
        button.textContent?.includes('Reset to default'),
    );
    assert(Boolean(picker && hex && save && reset), 'Brand color exposes its picker, hex field and actions');
    if (!picker || !hex || !save || !reset) return;
    assert(
        hex.getBoundingClientRect().height >= 44,
        `Brand color hex input meets the 44px target (${hex.getBoundingClientRect().height}px)`,
    );
    assert(
        picker.getBoundingClientRect().width >= 44 && picker.getBoundingClientRect().height >= 44,
        'Brand color picker meets the 44px target',
    );
    assert(
        save.getBoundingClientRect().height >= 44 && reset.getBoundingClientRect().height >= 44,
        'Brand color actions meet the 44px touch target',
    );

    const help = document.querySelector('#brand-color-help');
    assert(hex.labels?.length === 1, 'Brand color hex field has an explicit label');
    assert(help?.textContent === 'Use #RGB or #RRGGBB.', 'Brand color format help is shown');
    assert(!document.querySelector('#brand-color-error'), 'Brand color has no validation error before interaction');
    assert(
        hex.getAttribute('aria-describedby')?.includes('brand-color-help'),
        'Brand color field describes its format help',
    );

    await act(async () => setInputValue(hex, 'invalid'));
    const error = document.querySelector('#brand-color-error');
    assert(
        error?.textContent === 'Enter a valid hex color, such as #RGB or #RRGGBB.' &&
            hex.getAttribute('aria-invalid') === 'true' &&
            hex.getAttribute('aria-describedby')?.includes('brand-color-error'),
        'Invalid brand color is explained and associated with the invalid field',
    );
    assert(picker.value === '#123456', 'Invalid hex leaves the picker on the last valid color');
    const beforeInvalid = brandingFixture.postCount;
    const readsBeforeReset = brandingFixture.requests.filter(({ method }) => method === 'get').length;
    await act(async () => save.click());
    assert(brandingFixture.postCount === beforeInvalid, 'Invalid brand color cannot be saved');

    await act(async () => setInputValue(hex, '#ABCDEF'));
    assert(!reset.disabled, 'Reset stays enabled for saved/draft/default #123456/#ABCDEF/#ABCDEF');
    await act(async () => setInputValue(hex, ''));
    const beforeBlank = brandingFixture.postCount;
    await act(async () => save.click());
    assert(brandingFixture.postCount === beforeBlank, 'Blank brand color cannot be saved');
    assert(reset.disabled === false, 'Reset remains available when saved color differs from its default');
    await act(async () => reset.click());
    assert(brandingFixture.postCount === beforeInvalid + 1, 'Reset clears an invalid draft');
    assert(
        JSON.stringify(brandingFixture.requests.filter(({ method }) => method === 'post').at(-1)?.data) ===
            JSON.stringify({ 'app:brand_color': null }),
        'Reset submits null using the server setting key',
    );
    assert(picker.value === '#abcdef' && hex.value === '#ABCDEF', 'Reset uses the server default in both controls');
    assert(
        brandingFixture.requests.filter(({ method }) => method === 'get').length > readsBeforeReset && reset.disabled,
        'Reset refetches server state and disables itself at the default',
    );
    await act(async () => setInputValue(hex, 'invalid'));
    assert(!reset.disabled, 'Reset stays enabled for an invalid draft when the saved color is already default');
    await act(async () => reset.click());
    assert(picker.value === '#abcdef' && hex.value === '#ABCDEF', 'Reset clears an invalid draft even at the default');

    await act(async () => setInputValue(hex, '#abc'));
    assert(picker.value === '#aabbcc', 'Short hex updates the native picker to its normalized color');
    assert(save.disabled === false, 'A changed valid color can be saved');
    brandingFixture.responseBrandColor = '#abc';
    await act(async () => save.click());
    assert(
        JSON.stringify(brandingFixture.requests.filter(({ method }) => method === 'post').at(-1)?.data) ===
            JSON.stringify({ 'app:brand_color': '#AABBCC' }),
        'Save submits normalized brand color',
    );
    assert(
        picker.value === '#aabbcc' && hex.value === '#AABBCC',
        'Short hex returned by the server is normalized in the saved draft and picker',
    );
    assert(save.disabled, 'Save is disabled when draft matches the saved color');
    brandingFixture.responseBrandColor = undefined;

    await act(async () => setInputValue(hex, '#fedcba'));
    brandingFixture.responseBrandColor = 'not-a-color';
    await act(async () => save.click());
    assert(
        picker.value === '#abcdef' && hex.value === '#ABCDEF',
        'Invalid saved response falls back to the valid server default',
    );
    brandingFixture.responseBrandColor = undefined;

    await act(async () => setInputValue(hex, '#fedcba'));
    for (const status of ['422', '500'] as const) {
        brandingFixture.postBehavior = status;
        await act(async () => reset.click());
        assert(hex.value === '#fedcba' && !reset.disabled, `Reset HTTP ${status} preserves the exact draft for retry`);
    }
    brandingFixture.postBehavior = 'success';
    const beforeResetRetry = brandingFixture.postCount;
    await act(async () => reset.click());
    assert(
        brandingFixture.postCount === beforeResetRetry + 1 &&
            JSON.stringify(brandingFixture.requests.filter(({ method }) => method === 'post').at(-1)?.data) ===
                JSON.stringify({ 'app:brand_color': null }) &&
            picker.value === '#abcdef' &&
            hex.value === '#ABCDEF',
        'Retry resets the preserved draft using the server default',
    );

    for (const status of ['422', '500'] as const) {
        await act(async () => setInputValue(hex, '#fedcba'));
        brandingFixture.postBehavior = status;
        await act(async () => save.click());
        assert(hex.value === '#fedcba' && !save.disabled, `HTTP ${status} preserves the exact draft for retry`);
        brandingFixture.postBehavior = 'success';
    }
    await act(async () => save.click());
    assert(
        save.disabled &&
            JSON.stringify(brandingFixture.requests.filter(({ method }) => method === 'post').at(-1)?.data) ===
                JSON.stringify({ 'app:brand_color': '#FEDCBA' }),
        'Retry saves the normalized preserved draft successfully',
    );

    await act(async () => setInputValue(hex, '#778899'));
    brandingFixture.postBehavior = 'deferred';
    const beforeDeferred = brandingFixture.postCount;
    act(() => {
        save.click();
        reset.click();
    });
    for (let attempts = 0; attempts < 30 && !brandingFixture.releasePost; attempts++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert(Boolean(brandingFixture.releasePost), 'Brand-color save reaches the deferred request');
    assert(
        save.disabled && reset.disabled && hex.disabled && picker.disabled,
        'Pending save disables both actions and both editors',
    );
    assert(
        save.querySelector('[role="status"]')?.textContent?.includes('Saving color…'),
        'Pending save exposes a readable live progress status',
    );
    assert(brandingFixture.postCount === beforeDeferred + 1, 'Pending save blocks duplicate and competing requests');
    await act(async () => {
        brandingFixture.releasePost?.();
        for (let attempts = 0; attempts < 30 && hex.disabled; attempts++) {
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
    });
    brandingFixture.postBehavior = 'success';
    assert(
        !hex.disabled && !picker.disabled && save.disabled && !reset.disabled,
        'Deferred save completes and actions return to their appropriate states',
    );

    brandingFixture.postBehavior = 'deferred';
    act(() => reset.click());
    for (let attempts = 0; attempts < 30 && !brandingFixture.releasePost; attempts++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert(
        save.disabled && reset.disabled && hex.disabled && picker.disabled,
        'Pending reset disables both actions and both editors',
    );
    assert(
        reset.querySelector('[role="status"]')?.textContent?.includes('Resetting color…'),
        'Pending reset exposes a readable live progress status',
    );
    const beforeCompetingSave = brandingFixture.postCount;
    await act(async () => save.click());
    assert(brandingFixture.postCount === beforeCompetingSave, 'Pending reset blocks a competing save');
    await act(async () => {
        brandingFixture.releasePost?.();
        for (let attempts = 0; attempts < 30 && hex.disabled; attempts++) {
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
    });
    brandingFixture.postBehavior = 'success';
    assert(
        !hex.disabled &&
            !picker.disabled &&
            save.disabled &&
            reset.disabled &&
            picker.value === '#abcdef' &&
            hex.value === '#ABCDEF',
        'Deferred reset re-enables controls with the returned server default',
    );
}

function verifyAppearanceRadioGroups() {
    const groups = [
        {
            name: 'appearance-mode',
            values: ['light', 'dark', 'system'],
            labels: ['Light', 'Dark', 'Use system setting'],
        },
        {
            name: 'appearance-palette',
            values: Object.keys(appearancePalettes),
            labels: Object.values(appearancePalettes),
        },
        { name: 'appearance-accent', values: Object.keys(appearanceAccents), labels: Object.values(appearanceAccents) },
    ];
    for (const { name, values, labels } of groups) {
        const radios = Array.from(document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${name}"]`));
        assert(radios.length === values.length, `${name}: renders ${values.length} native radio choices`);
        assert(
            radios.every((radio, index) => radio.value === values[index]),
            `${name}: preserves stored choice values`,
        );
        assert(radios.filter((radio) => radio.checked).length === 1, `${name}: has exactly one selected choice`);
        assert(
            radios.every((radio, index) => radio.labels?.[0]?.textContent?.trim().includes(labels[index] ?? '')),
            `${name}: every radio has its visible accessible label`,
        );
        assert(
            radios.every((radio) => !radio.disabled && radio.tabIndex >= 0),
            `${name}: radios remain keyboard focusable`,
        );
        assert(
            radios.every((radio) => {
                const target = radio.closest('label')?.getBoundingClientRect();
                return Boolean(target && target.width >= 44 && target.height >= 44);
            }),
            `${name}: each selectable label is at least 44 by 44 pixels`,
        );
    }
    assert(document.querySelectorAll('fieldset').length === 3, 'Appearance choices use three semantic fieldsets');
    assert(
        Array.from(document.querySelectorAll('fieldset legend'))
            .map((legend) => legend.textContent?.trim())
            .join('|') === 'Theme|Application palette|Accent color',
        'Appearance fieldsets are named in the specified order',
    );
    assert(
        Array.from(document.querySelectorAll('fieldset')).every((fieldset) => {
            const descriptionId = fieldset.getAttribute('aria-describedby');
            return Boolean(descriptionId && document.getElementById(descriptionId));
        }),
        'Each appearance fieldset references its description',
    );
    const fieldsets = Array.from(document.querySelectorAll('fieldset'));
    assert(
        fieldsets[1]?.querySelectorAll('.appearance-preview[data-theme][data-palette]').length ===
            Object.keys(appearancePalettes).length &&
            fieldsets[1]?.querySelectorAll('.appearance-preview > span').length ===
                Object.keys(appearancePalettes).length * 3,
        'Each palette choice previews its background, surface and text tokens in isolation',
    );
    assert(
        Array.from(fieldsets[1]?.querySelectorAll('.appearance-preview') ?? []).every((preview) => {
            const { width, height } = preview.getBoundingClientRect();
            return width >= 80 && height >= 32;
        }),
        'Palette color samples stay large enough to compare at narrow and wide layouts',
    );
    assert(
        Array.from(fieldsets[1]?.querySelectorAll<HTMLInputElement>('input[name="appearance-palette"]') ?? []).every(
            (radio) => Boolean(radio.closest('label')?.querySelector('[data-selected-indicator]')) === radio.checked,
        ),
        'Only the selected palette displays its visual selection marker',
    );
    assert(
        Array.from(fieldsets[1]?.querySelectorAll<HTMLInputElement>('input[name="appearance-palette"]') ?? []).every(
            (radio) => {
                const label = radio.closest('label');
                const textElement = label?.querySelector('span.min-w-0');
                const text = textElement?.getBoundingClientRect();
                const sample = label?.querySelector('.appearance-preview')?.getBoundingClientRect();
                return Boolean(
                    textElement &&
                        textElement.scrollWidth <= textElement.clientWidth &&
                        text &&
                        sample &&
                        (text.right <= sample.left ||
                            sample.right <= text.left ||
                            text.bottom <= sample.top ||
                            sample.bottom <= text.top),
                );
            },
        ),
        'Palette label text and samples never overlap',
    );
    assert(
        fieldsets[2]?.querySelectorAll('.appearance-preview[data-theme][data-palette][data-accent]').length === 6,
        'Each accent choice previews its scoped accent token',
    );
}

function verifyCuratedPaletteSamples(theme: 'dark' | 'light') {
    const expected = {
        obsidian: {
            dark: ['rgb(17, 18, 26)', 'rgb(27, 29, 40)', 'rgb(242, 240, 250)'],
            light: ['rgb(248, 247, 252)', 'rgb(255, 255, 255)', 'rgb(39, 38, 51)'],
        },
        dracula: {
            dark: ['rgb(40, 42, 54)', 'rgb(52, 55, 70)', 'rgb(248, 248, 242)'],
            light: ['rgb(255, 251, 235)', 'rgb(239, 237, 220)', 'rgb(31, 31, 31)'],
        },
        nord: {
            dark: ['rgb(46, 52, 64)', 'rgb(59, 66, 82)', 'rgb(236, 239, 244)'],
            light: ['rgb(236, 239, 244)', 'rgb(229, 233, 240)', 'rgb(46, 52, 64)'],
        },
    } as const;

    for (const [palette, modes] of Object.entries(expected)) {
        const preview = document.querySelector(`.appearance-preview[data-theme="${theme}"][data-palette="${palette}"]`);
        if (!preview) throw new Error(`Missing ${theme}/${palette} palette preview`);
        const samples = Array.from(preview.children, (sample) => getComputedStyle(sample).backgroundColor);
        assert(
            samples.join('|') === modes[theme].join('|'),
            `${theme}/${palette}: swatches show the named theme's surface colors (${samples.join('|')})`,
        );
    }
}

const appearanceTokenNames = ['--color-bg', '--color-bg-raised', '--color-primary', '--panel-accent'];

function readAppearanceTokens(element: Element) {
    const style = getComputedStyle(element);
    return appearanceTokenNames.map((name) => style.getPropertyValue(name).trim());
}

async function verifyPalettePreviewIsolation() {
    const saved = JSON.parse(localStorage.getItem(appearanceStorageKey) ?? '{}') as {
        mode?: string;
        palette?: string;
        accent?: string;
    };
    let preview: HTMLDivElement | undefined;
    try {
        for (const mode of ['dark', 'light']) {
            for (const palette of Object.keys(appearancePalettes)) {
                for (const accent of Object.keys(appearanceAccents)) {
                    await change('appearance-mode', mode);
                    await change('appearance-palette', palette);
                    await change('appearance-accent', accent);
                    const expected = readAppearanceTokens(document.documentElement);
                    const otherPalette = palette === 'blue' ? 'green' : 'blue';
                    const otherAccent = accent === 'panel' ? 'rose' : 'panel';
                    await change('appearance-mode', mode === 'dark' ? 'light' : 'dark');
                    await change('appearance-palette', otherPalette);
                    await change('appearance-accent', otherAccent);
                    const rootBefore = {
                        theme: document.documentElement.dataset.theme,
                        palette: document.documentElement.dataset.palette,
                        accent: document.documentElement.dataset.accent,
                        tokens: readAppearanceTokens(document.documentElement),
                    };
                    preview = document.createElement('div');
                    preview.className = 'appearance-preview';
                    preview.dataset.theme = mode;
                    preview.dataset.palette = palette;
                    preview.dataset.accent = accent;
                    document.body.append(preview);
                    const combination = `${mode}/${palette}/${accent}`;
                    assert(
                        JSON.stringify(readAppearanceTokens(preview)) === JSON.stringify(expected),
                        `${combination}: preview tokens match the applied appearance`,
                    );
                    assert(
                        document.documentElement.dataset.theme === rootBefore.theme &&
                            document.documentElement.dataset.palette === rootBefore.palette &&
                            document.documentElement.dataset.accent === rootBefore.accent &&
                            JSON.stringify(readAppearanceTokens(document.documentElement)) ===
                                JSON.stringify(rootBefore.tokens),
                        `${combination}: rendering the preview leaves root appearance unchanged`,
                    );
                    preview.remove();
                    preview = undefined;
                }
            }
        }
    } finally {
        preview?.remove();
        await change('appearance-mode', saved.mode ?? 'dark');
        await change('appearance-palette', saved.palette ?? 'neutral');
        await change('appearance-accent', saved.accent ?? 'panel');
    }
}

async function verifyBrandingAdapter() {
    const rejectedRequests: BrandingRequest[] = [];
    const rejectUnexpected = createBrandingFixtureAdapter(rejectedRequests);
    const config = (method: string, url: string) =>
        ({ method, url, headers: new AxiosHeaders() }) as InternalAxiosRequestConfig;
    for (const [method, url] of [
        ['delete', '/admin/api/settings/logo'],
        ['get', '/admin/api/other'],
    ]) {
        let rejected = false;
        try {
            await rejectUnexpected(config(method, url));
        } catch {
            rejected = true;
        }
        assert(rejected, `Fixture blocks ${method.toUpperCase()} ${url}`);
    }
    assert(rejectedRequests.length === 2, 'Fixture records disallowed requests before rejecting them');

    http.defaults.adapter = createBrandingFixtureAdapter(brandingFixture.requests);
    await updateLogo({ brand_color: '#AABBCC' });
    const colorRequest = brandingFixture.requests.at(-1)?.data as Record<string, unknown> | undefined;
    assert(
        colorRequest?.['app:brand_color'] === '#AABBCC' && !('brand_color' in colorRequest),
        'The real API client sends the server brand-color setting key',
    );
    for (const status of ['422', '500'] as const) {
        brandingFixture.postBehavior = status;
        let responseStatus: number | undefined;
        try {
            await updateLogo({ brand_color: '#AABBCC' });
        } catch (error) {
            if (error instanceof AxiosError) responseStatus = error.response?.status;
        }
        assert(responseStatus === Number(status), `Fixture returns AxiosError HTTP ${status}`);
    }
    brandingFixture.postBehavior = 'deferred';
    let settled = false;
    const pending = updateLogo({ brand_color: '#AABBCC' }).finally(() => {
        settled = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert(!settled && Boolean(brandingFixture.releasePost), 'Fixture can hold a POST until explicitly released');
    brandingFixture.releasePost?.();
    await pending;
    assert(settled, 'Fixture releases a deferred POST');

    brandingFixture.postBehavior = 'success';
    brandingFixture.postCount = 0;
    brandingFixture.requests.length = 0;
    brandingFixture.response.brandColor = '#123456';
}

function contrast(foreground: string, background: string) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    const luminance = (color: string, base = '#ffffff') => {
        context.fillStyle = base;
        context.fillRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const channels = Array.from(context.getImageData(0, 0, 1, 1).data)
            .slice(0, 3)
            .map((value) => {
                const channel = value / 255;
                return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            });
        return (channels[0] ?? 0) * 0.2126 + (channels[1] ?? 0) * 0.7152 + (channels[2] ?? 0) * 0.0722;
    };
    const first = luminance(foreground, background);
    const second = luminance(background);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function verifyThemeToggleFocusContrast(mode: string, palette: string) {
    const button = document.querySelector<HTMLButtonElement>('#app-header-fixture button[aria-label^="Switch to "]');
    if (!button) throw new Error('Missing AppHeader theme toggle');
    const ringClass = button.className.split(/\s+/).find((utility) => utility.startsWith('focus-visible:ring-mocha-'));
    const ringColor = ringClass
        ? getComputedStyle(document.documentElement).getPropertyValue(
              `--color-${ringClass.slice('focus-visible:ring-'.length)}`,
          )
        : '';
    const canvasColor = getComputedStyle(document.documentElement).getPropertyValue('--color-canvas');
    assert(
        Boolean(ringClass) && contrast(ringColor, canvasColor) >= 3,
        `${mode}/${palette}: theme-toggle focus indicator passes 3:1 contrast`,
    );
}

async function run() {
    let app: ReturnType<typeof createRoot> | undefined;
    try {
        localStorage.removeItem(appearanceStorageKey);
        await verifyBrandingAdapter();
        app = createRoot(root as HTMLElement);
        await act(async () => {
            app?.render(
                <SWRConfig value={appearanceSWRConfig}>
                    <Preview />
                </SWRConfig>,
            );
        });
        for (let attempts = 0; attempts < 50 && brandingFixture.requests.length === 0; attempts++) {
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
        assert(
            brandingFixture.requests.some(({ method, url }) => method === 'get' && url === '/admin/api/settings/logo'),
            'Branding fixture loads its deterministic response through the real API client',
        );
        await verifyBrandColorForm();
        assert(document.documentElement.dataset.theme === 'dark', 'Default is dark even when the system is light');
        const headerScenarios = ['client-legacy', 'client-slotted', 'admin-legacy', 'admin-slotted'] as const;
        const headerWidths = [document.documentElement.clientWidth];
        for (const scenario of headerScenarios) {
            await switchHeaderScenario(scenario);
            for (const width of headerWidths) await verifyHeaderScenario(scenario, width);
        }
        await switchHeaderScenario('client-legacy');
        assert(
            Boolean(document.querySelector('button[aria-label="Switch to light mode"]')),
            'Theme toggle exposes the dark-mode accessible name',
        );
        assert(
            (document.querySelector('button[aria-label="Switch to light mode"]') as HTMLButtonElement).dataset.icon ===
                'sun',
            'Dark mode renders the Sun icon',
        );
        await clickThemeToggle();
        verifyThemeToggle('light');
        await clickThemeToggle();
        verifyThemeToggle('dark');
        await change('appearance-mode', 'system');
        await act(async () => {
            systemDark = false;
            media.dispatchEvent(new Event('change'));
        });
        assert(document.documentElement.dataset.theme === 'light', 'System/light resolves to light before toggling');
        await clickThemeToggle();
        verifyThemeToggle('dark');
        await act(async () => {
            systemDark = true;
            media.dispatchEvent(new Event('change'));
        });
        assert(document.documentElement.dataset.theme === 'dark', 'Explicit dark ignores a later OS change');
        await change('appearance-mode', 'system');
        await act(async () => {
            systemDark = false;
            media.dispatchEvent(new Event('change'));
        });
        assert(document.documentElement.dataset.theme === 'light', 'Selecting System resumes OS control');
        await act(async () => {
            systemDark = true;
            media.dispatchEvent(new Event('change'));
        });
        assert(document.documentElement.dataset.theme === 'dark', 'System dark resolves to dark before toggling');
        await clickThemeToggle();
        verifyThemeToggle('light');
        await act(async () => {
            systemDark = false;
            media.dispatchEvent(new Event('change'));
        });
        assert(document.documentElement.dataset.theme === 'light', 'Explicit light ignores a later OS change');
        await change('appearance-mode', 'dark');
        await change('appearance-palette', 'blue');
        await change('appearance-accent', 'green');
        const beforeThemeToggle = JSON.parse(localStorage.getItem(appearanceStorageKey) ?? '{}') as {
            palette?: string;
            accent?: string;
        };
        const brandColorBeforeThemeToggle = document.documentElement.style.getPropertyValue('--brand-color');
        await clickThemeToggle();
        verifyThemeToggle('light');
        const afterThemeToggle = JSON.parse(localStorage.getItem(appearanceStorageKey) ?? '{}') as {
            palette?: string;
            accent?: string;
        };
        assert(
            afterThemeToggle.palette === beforeThemeToggle.palette &&
                afterThemeToggle.accent === beforeThemeToggle.accent &&
                document.documentElement.dataset.palette === 'blue' &&
                document.documentElement.dataset.accent === 'green' &&
                document.documentElement.style.getPropertyValue('--brand-color') === brandColorBeforeThemeToggle,
            'Theme toggle preserves palette, accent and server branding',
        );
        await change('appearance-mode', 'dark');
        await change('appearance-palette', 'neutral');
        await change('appearance-accent', 'panel');
        systemDark = false;
        const restoredBaseline = JSON.parse(localStorage.getItem(appearanceStorageKey) ?? '{}') as {
            mode?: string;
            palette?: string;
            accent?: string;
        };
        assert(
            restoredBaseline.mode === 'dark' &&
                restoredBaseline.palette === 'neutral' &&
                restoredBaseline.accent === 'panel' &&
                document.documentElement.dataset.palette === 'neutral' &&
                document.documentElement.dataset.accent === 'panel',
            'Theme toggle checks restore distinct appearance values before palette and accent interactions',
        );
        localStorage.setItem('appearance-fixture-unrelated', 'preserve');
        verifyAppearanceRadioGroups();
        const editorElement = document.querySelector('.cm-editor') as HTMLElement;
        assert(
            getComputedStyle(editorElement).color === 'rgb(203, 204, 198)',
            'The editor uses its dark theme on first mount',
        );
        const editor = EditorView.findFromDOM(editorElement);
        if (!editor) throw new Error('Editor did not mount');
        await act(async () => {
            editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: 'unsaved-port=25566' } });
        });
        const consoleElement = document.querySelector('.xterm');
        assert(Boolean(consoleElement), 'The real terminal mounts');
        const commandInput = document.querySelector('input[aria-label="Console command input."]') as HTMLInputElement;
        commandInput.value = 'say unsaved command';
        consoleSocket.emit(SocketEvent.CONSOLE_OUTPUT, 'Preserved console output');
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        await clickThemeToggle();
        assert(document.documentElement.dataset.theme === 'light', 'Integrated header toggle changes the active theme');
        assert(
            (await getContent?.()) === 'unsaved-port=25566',
            'Integrated header toggle preserves unsaved editor content',
        );
        assert(
            document.querySelector('.cm-editor') === editorElement,
            'Integrated header toggle preserves the editor instance',
        );
        assert(
            document.querySelector('.xterm') === consoleElement,
            'Integrated header toggle preserves the terminal instance',
        );
        assert(commandInput.value === 'say unsaved command', 'Integrated header toggle preserves the unsent command');
        assert(
            consoleSocket.listenerCount(SocketEvent.CONSOLE_OUTPUT) === 1,
            'Integrated header toggle keeps one console output listener',
        );
        assert(
            document.querySelector('.xterm')?.textContent?.includes('Preserved console output'),
            'Integrated header toggle preserves console output',
        );
        await change('appearance-mode', 'light');
        assert(document.documentElement.dataset.theme === 'light', 'Selecting light updates the page');
        assert(
            JSON.parse(localStorage.getItem(appearanceStorageKey) ?? '{}').mode === 'light',
            'Selection persists locally',
        );
        await change('appearance-mode', 'system');
        await act(async () => {
            systemDark = true;
            media.dispatchEvent(new Event('change'));
        });
        assert(document.documentElement.dataset.theme === 'dark', 'System mode follows a live OS change');
        await change('appearance-mode', 'light');
        await act(async () => {
            media.dispatchEvent(new Event('change'));
        });
        assert(document.documentElement.dataset.theme === 'light', 'An explicit theme ignores the OS');
        const brandColorBeforePalette = document.documentElement.style.getPropertyValue('--brand-color');
        const beforePaletteChange = JSON.parse(localStorage.getItem(appearanceStorageKey) ?? '{}') as {
            mode?: string;
            palette?: string;
            accent?: string;
        };
        await change('appearance-palette', 'blue');
        const afterPaletteChange = JSON.parse(
            localStorage.getItem(appearanceStorageKey) ?? '{}',
        ) as typeof beforePaletteChange;
        assert(
            afterPaletteChange.palette === 'blue' &&
                afterPaletteChange.mode === beforePaletteChange.mode &&
                afterPaletteChange.accent === beforePaletteChange.accent &&
                document.documentElement.dataset.palette === 'blue' &&
                document.documentElement.dataset.theme === 'light' &&
                document.documentElement.dataset.accent === beforePaletteChange.accent &&
                document.documentElement.style.getPropertyValue('--brand-color') === brandColorBeforePalette,
            'Palette selection persists without changing theme, accent or branding',
        );
        const brandColorBeforeAccent = document.documentElement.style.getPropertyValue('--brand-color');
        await change('appearance-accent', 'green');
        const afterAccentChange = JSON.parse(
            localStorage.getItem(appearanceStorageKey) ?? '{}',
        ) as typeof beforePaletteChange;
        assert(
            afterAccentChange.accent === 'green' &&
                afterAccentChange.mode === beforePaletteChange.mode &&
                afterAccentChange.palette === 'blue' &&
                document.documentElement.dataset.accent === 'green' &&
                document.documentElement.dataset.palette === 'blue' &&
                document.documentElement.dataset.theme === 'light' &&
                document.documentElement.style.getPropertyValue('--brand-color') === brandColorBeforeAccent,
            'Accent selection persists without changing theme, palette or branding',
        );
        await verifyPalettePreviewIsolation();
        const accentColors = new Map<string, string>();
        for (const mode of ['dark', 'light']) {
            await change('appearance-mode', mode);
            verifyCuratedPaletteSamples(mode);
            const surfaces = new Set<string>();
            for (const palette of Object.keys(appearancePalettes)) {
                await change('appearance-palette', palette);
                verifyThemeToggleFocusContrast(mode, palette);
                assert(document.documentElement.dataset.palette === palette, `${mode}/${palette}: palette applies`);
                const paletteSurface = document.querySelector('main') as HTMLElement;
                surfaces.add(getComputedStyle(paletteSurface).backgroundColor);
                for (const accent of Object.keys(appearanceAccents)) {
                    await change('appearance-accent', accent);
                    assert(document.documentElement.dataset.accent === accent, `${mode}/${accent}: accent applies`);
                    const surface = document.querySelector('main');
                    const sample = document.querySelector('.text-hydro-400');
                    const text = document.querySelector('label.text-secondary');
                    if (!surface || !sample || !text) throw new Error('Missing contrast probes');
                    const accentColor = getComputedStyle(sample).color;
                    const key = `${mode}/${accent}`;
                    if (accentColors.has(key))
                        assert(
                            accentColors.get(key) === accentColor,
                            `${key}/${palette}: accent is independent of palette`,
                        );
                    else accentColors.set(key, accentColor);
                    assert(
                        contrast(getComputedStyle(sample).color, getComputedStyle(surface).backgroundColor) >= 4.5,
                        `${mode}/${accent}: accent text passes WCAG AA`,
                    );
                    assert(
                        contrast(
                            getComputedStyle(text).color,
                            getComputedStyle(text.closest('.bg-mocha-500') as Element).backgroundColor,
                        ) >= 4.5,
                        `${mode}/${accent}: secondary text passes WCAG AA`,
                    );
                    const accentButton = document.querySelector('button.bg-hydro-500') as HTMLButtonElement;
                    const buttonStyle = getComputedStyle(accentButton);
                    assert(
                        contrast(buttonStyle.color, buttonStyle.backgroundColor) >= 4.5,
                        `${mode}/${accent}: accent button passes WCAG AA`,
                    );
                    const error = document.querySelector('.text-red-400') as HTMLElement;
                    const errorContrast = contrast(
                        getComputedStyle(error).color,
                        getComputedStyle(surface).backgroundColor,
                    );
                    const attention = Array.from(document.querySelectorAll('button')).find(
                        (button) => button.textContent === 'Attention action',
                    ) as HTMLButtonElement;
                    assert(
                        contrast(getComputedStyle(attention).color, getComputedStyle(attention).backgroundColor) >= 4.5,
                        `${mode}/${palette}/${accent}: attention button passes WCAG AA`,
                    );
                    assert(
                        errorContrast >= 4.5,
                        `${mode}/${palette}/${accent}: error status passes WCAG AA (${errorContrast.toFixed(2)}:1)`,
                    );
                    const muted = document.querySelector('[data-muted-probe]') as HTMLElement;
                    assert(
                        contrast(
                            getComputedStyle(muted).color,
                            getComputedStyle(muted.closest('.bg-mocha-500') as Element).backgroundColor,
                        ) >= 4.5,
                        `${mode}/${accent}: existing muted labels pass WCAG AA`,
                    );
                }
            }
            assert(
                surfaces.size === Object.keys(appearancePalettes).length,
                `${mode}: every palette changes the application background`,
            );
        }
        const savedAppearance = JSON.parse(localStorage.getItem(appearanceStorageKey) ?? '{}') as {
            mode?: string;
            palette?: string;
            accent?: string;
        };
        assert(
            savedAppearance.mode === 'light' &&
                savedAppearance.palette === 'mocha' &&
                savedAppearance.accent === 'rose',
            'Normal radio selections persist the selected theme, palette and accent',
        );
        assert(mountCount === 1, 'Changing appearance does not remount the application');
        assert(
            (document.getElementById('preview-input') as HTMLInputElement).value === 'Unsaved input',
            'Input state survives theme changes',
        );
        assert((await getContent?.()) === 'unsaved-port=25566', 'Unsaved editor content survives theme changes');
        assert(document.querySelector('.cm-editor') === editorElement, 'The editor instance survives theme changes');
        assert(document.querySelector('.xterm') === consoleElement, 'The terminal instance survives theme changes');
        assert(commandInput.value === 'say unsaved command', 'The unsent console command survives theme changes');
        assert(
            consoleSocket.listenerCount(SocketEvent.CONSOLE_OUTPUT) === 1,
            'Theme changes do not duplicate socket listeners',
        );
        let clipboard = '';
        const originalClipboard = navigator.clipboard;
        try {
            Object.defineProperty(navigator, 'clipboard', {
                configurable: true,
                value: {
                    writeText: async (value: string) => {
                        clipboard = value;
                    },
                },
            });
            await act(async () => {
                (document.querySelector('[aria-label="Copy full console output"]') as HTMLButtonElement).click();
            });
            assert(clipboard.includes('Preserved console output'), 'Console output survives theme changes');
        } finally {
            Object.defineProperty(navigator, 'clipboard', { configurable: true, value: originalClipboard });
        }
        await act(async () => {
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key: appearanceStorageKey,
                    newValue: JSON.stringify({ mode: 'dark', accent: 'green', palette: 'blue' }),
                    storageArea: localStorage,
                }),
            );
        });
        assert(
            document.documentElement.dataset.theme === 'dark' && document.documentElement.dataset.accent === 'green',
            'Other tabs synchronize appearance',
        );
        assert(document.documentElement.dataset.palette === 'blue', 'Other tabs synchronize the application palette');
        await act(async () => {
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key: appearanceStorageKey,
                    newValue: JSON.stringify({ mode: 'light', accent: 'blue' }),
                    storageArea: sessionStorage,
                }),
            );
        });
        assert(
            document.documentElement.dataset.accent === 'green',
            'Session storage cannot override local preferences',
        );
        await act(async () => {
            window.dispatchEvent(new StorageEvent('storage', { key: null, newValue: null, storageArea: localStorage }));
        });
        assert(
            document.documentElement.dataset.theme === 'dark' && document.documentElement.dataset.accent === 'panel',
            'Clearing storage in another tab restores defaults',
        );
        const originalSetItem = Storage.prototype.setItem;
        try {
            assert(document.documentElement.dataset.theme === 'dark', 'Fixture is dark before blocked storage check');
            assert(
                Boolean(document.querySelector('input[name="appearance-mode"][value="dark"]:checked')),
                'Appearance settings show dark before the blocked-storage toggle',
            );
            const savedPreferences = JSON.parse(localStorage.getItem(appearanceStorageKey) ?? '{}') as Record<
                string,
                unknown
            >;
            const savedAppearance = JSON.stringify({ ...savedPreferences, mode: 'dark' });
            originalSetItem.call(localStorage, appearanceStorageKey, savedAppearance);
            Storage.prototype.setItem = () => {
                throw new Error('Storage blocked');
            };
            await clickThemeToggle();
            assert(
                document.documentElement.dataset.theme === 'light',
                'Storage failure still allows a real theme-toggle transition',
            );
            assert(
                localStorage.getItem(appearanceStorageKey) === savedAppearance,
                'Storage failure leaves the saved appearance unchanged',
            );
            assert(Boolean(document.querySelector('main [role="status"]')), 'Storage failure is explained to the user');
            const storageToast = document.querySelector('[data-sonner-toast]');
            assert(
                storageToast?.textContent?.includes(
                    'Browser storage is unavailable. Your selection will last until you reload this page.',
                ),
                'Theme toggle shows the exact storage warning toast',
            );
            await act(async () => rerenderThemeToggle?.());
            assert(
                document.documentElement.dataset.theme === 'light' && storageWarningToasts().length === 1,
                'Re-rendering while storage stays unavailable does not duplicate the warning',
            );
        } finally {
            Storage.prototype.setItem = originalSetItem;
        }
        const failureMount = document.createElement('div');
        document.body.append(failureMount);
        const failureApp = createRoot(failureMount);
        const originalSetItemForMount = Storage.prototype.setItem;
        try {
            Storage.prototype.setItem = () => {
                throw new Error('Storage blocked');
            };
            await act(async () => {
                failureApp.render(
                    <AppearanceProvider>
                        <MountThemeToggleAfterStorageFailure />
                    </AppearanceProvider>,
                );
            });
            assert(
                failureMount.querySelector('[data-toggle-persistent="false"] button[aria-label^="Switch to "]'),
                'Theme toggle mounts when its provider already reports storage unavailable',
            );
            assert(
                storageWarningToasts().length === 1,
                'Stable toast id prevents duplicate UI when another failed provider mounts',
            );
        } finally {
            Storage.prototype.setItem = originalSetItemForMount;
            await act(async () => failureApp.unmount());
            failureMount.remove();
        }
        await act(async () => app?.unmount());
        app = undefined;
        app = createRoot(root as HTMLElement);
        await act(async () => {
            app?.render(
                <SWRConfig value={appearanceSWRConfig}>
                    <Preview />
                </SWRConfig>,
            );
        });
        const restoredPreferences = JSON.parse(localStorage.getItem(appearanceStorageKey) ?? '{}') as {
            mode?: string;
            palette?: string;
            accent?: string;
        };
        assert(
            document.documentElement.dataset.theme ===
                (restoredPreferences.mode === 'system' ? (systemDark ? 'dark' : 'light') : restoredPreferences.mode) &&
                document.documentElement.dataset.accent === restoredPreferences.accent &&
                document.documentElement.dataset.palette === restoredPreferences.palette,
            'A fresh mount restores the selected theme, palette and accent',
        );
        assert(document.documentElement.dataset.accent === 'rose', 'A fresh mount restores saved preferences');
        assert(document.documentElement.dataset.palette === 'mocha', 'A fresh mount restores the application palette');
        assert(document.documentElement.style.getPropertyValue('--brand-color') === '#52a9ff', 'Branding is preserved');
        assert(
            localStorage.getItem('appearance-fixture-unrelated') === 'preserve',
            'Unrelated browser storage is preserved',
        );

        brandingFixture.response.brandColor = 'not-a-color';
        brandingFixture.response.defaultBrandColor = '#nope';
        const readsBeforeInvalidServerColor = brandingFixture.requests.filter(({ method }) => method === 'get').length;
        await act(async () => {
            app?.render(
                <SWRConfig value={appearanceSWRConfig}>
                    <BrandingSettings />
                </SWRConfig>,
            );
        });
        for (
            let attempts = 0;
            attempts < 50 &&
            brandingFixture.requests.filter(({ method }) => method === 'get').length === readsBeforeInvalidServerColor;
            attempts++
        ) {
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
        const invalidConfigurationSave = [...document.querySelectorAll('button')].find((button) =>
            button.textContent?.includes('Save Color'),
        );
        const postsBeforeInvalidConfigurationSave = brandingFixture.postCount;
        assert(
            !document.querySelector('#brand-color-picker') &&
                document
                    .querySelector('[role="alert"]')
                    ?.textContent?.includes('neither the saved color nor the server default') &&
                invalidConfigurationSave?.disabled,
            'Invalid server and default colors are explained without rendering an invalid native picker',
        );
        await act(async () => invalidConfigurationSave?.click());
        assert(
            brandingFixture.postCount === postsBeforeInvalidConfigurationSave,
            'Invalid server configuration cannot submit an unusable brand color',
        );
        assert(
            brandingFixture.requests.every(
                ({ method, url }) => url === '/admin/api/settings/logo' && (method === 'get' || method === 'post'),
            ),
            'Only the allowed local branding GET and POST requests occurred',
        );
    } finally {
        if (app) await act(async () => app?.unmount());
        http.defaults.adapter = originalHttpAdapter;
        Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: false });
    }
    assert(http.defaults.adapter === originalHttpAdapter, 'Fixture restores the shared HTTP adapter');
    output.textContent = JSON.stringify(
        { passed: results.length, palettes: Object.keys(appearancePalettes), checks: results.slice(-16) },
        null,
        2,
    );
    output.dataset.result = 'passed';
    output.style.cssText =
        'position:fixed;bottom:0;right:0;max-height:12rem;max-width:45vw;overflow:auto;font-size:10px;background:var(--color-bg);color:var(--color-primary);z-index:10000';
}

void run().catch((error) => {
    output.textContent = JSON.stringify({ passed: results.length, error: String(error), checks: results }, null, 2);
    output.dataset.result = 'failed';
});
