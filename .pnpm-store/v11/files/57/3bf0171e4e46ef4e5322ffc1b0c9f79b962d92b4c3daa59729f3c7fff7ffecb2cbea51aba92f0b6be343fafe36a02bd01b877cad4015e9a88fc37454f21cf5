type IconSvgObject = ([string, {
    [key: string]: string | number;
}])[] | readonly (readonly [string, {
    readonly [key: string]: string | number;
}])[];

declare function loadIcon(iconName: string): Promise<IconSvgObject>;
declare function loadIcons(iconNames: string[]): Promise<IconSvgObject[]>;
declare function iconExists(iconName: string): boolean;
declare function clearIconCache(): void;
declare function getCacheSize(): number;
declare const loadIconFreeIcons: typeof loadIcon;
declare const loadIconsFreeIcons: typeof loadIcons;
declare const _default: {
    loadIcon: typeof loadIcon;
    loadIcons: typeof loadIcons;
    iconExists: typeof iconExists;
    clearIconCache: typeof clearIconCache;
    getCacheSize: typeof getCacheSize;
};

export { clearIconCache, _default as default, getCacheSize, iconExists, loadIcon, loadIconFreeIcons, loadIcons, loadIconsFreeIcons };
