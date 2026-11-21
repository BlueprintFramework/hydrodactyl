'use client';
import * as _unplugin from 'unplugin';
import * as _esbuild from 'esbuild';
import * as _rollup from 'rollup';
import * as _vite from 'vite';
import { PluginObj, PluginPass } from '@babel/core';
import * as t from '@babel/types';
import { MillionTelemetry } from 'packages/telemetry';
import { FilterPattern } from '@rollup/pluginutils';

interface NamedImportDefinition {
    name: string;
    source: string;
    kind: 'named';
}
interface DefaultImportDefinition {
    source: string;
    kind: 'default';
}
type ImportDefinition = NamedImportDefinition | DefaultImportDefinition;
interface CompilerOptions {
    hmr?: boolean;
    server?: boolean;
    auto?: boolean | {
        threshold?: number;
        skip?: (string | RegExp)[];
        rsc?: boolean;
    };
    /**
     * @default true
     */
    log?: boolean | 'info';
    /**
     * @default false
     */
    rsc?: boolean;
    telemetry: MillionTelemetry;
}
interface StateContext {
    options: CompilerOptions;
    definitions: {
        identifiers: Map<t.Identifier, ImportDefinition>;
        namespaces: Map<t.Identifier, ImportDefinition[]>;
    };
    imports: Map<string, t.Identifier>;
    topLevelRSC: boolean;
    serverMode: 'server' | 'client';
}

interface PluginState extends PluginPass {
    state: StateContext;
    opts: CompilerOptions;
}
declare function babel(): PluginObj<PluginState>;

interface Options extends Omit<CompilerOptions, 'telemetry'> {
    filter?: {
        include?: FilterPattern;
        exclude?: FilterPattern;
    };
    /**
     * @default 'react'
     */
    mode?: 'react' | 'vdom';
    /**
     * Million.js collects anonymous telemetry data about general usage. Participation is optional, and you may opt-out at any time.
     * For more information, please see https://million.dev/telemetry.
     * @default true
     */
    telemetry?: boolean;
}

declare const vite: (options: Options) => _vite.Plugin<any> | _vite.Plugin<any>[];
declare const webpack: (options: Options) => WebpackPluginInstance;
declare const rollup: (options: Options) => _rollup.Plugin<any> | _rollup.Plugin<any>[];
declare const rspack: (options: Options) => RspackPluginInstance;
declare const esbuild: (options: Options) => _esbuild.Plugin;
declare const next: (nextConfig?: {
    appDir?: boolean | undefined;
    basePath?: string | undefined;
    webpack?: ((config: Record<string, any>, options: any) => any) | undefined;
}, overrideOptions?: Options) => any;

declare const _default: {
    vite: (options: Options) => _vite.Plugin<any> | _vite.Plugin<any>[];
    webpack: (options: Options) => WebpackPluginInstance;
    rollup: (options: Options) => _rollup.Plugin<any> | _rollup.Plugin<any>[];
    rspack: (options: Options) => RspackPluginInstance;
    esbuild: (options: Options) => _esbuild.Plugin;
    next: (nextConfig?: {
        appDir?: boolean | undefined;
        basePath?: string | undefined;
        webpack?: ((config: Record<string, any>, options: any) => any) | undefined;
    }, overrideOptions?: Options) => any;
    unplugin: _unplugin.UnpluginInstance<Options, boolean>;
    babel: typeof babel;
};

export { babel, _default as default, esbuild, next, rollup, rspack, vite, webpack };
