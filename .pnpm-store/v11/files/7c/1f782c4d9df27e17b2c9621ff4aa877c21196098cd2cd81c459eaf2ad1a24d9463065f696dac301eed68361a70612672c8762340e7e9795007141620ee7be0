import { Plugin } from 'vite';

type Algorithm = 'sha256' | 'sha384' | 'sha512';
interface Options {
    /**
     * Which hashing algorithms to use when calculate the integrity hash for each
     * asset in the manifest.
     *
     * @default ['sha384']
     */
    algorithms?: Algorithm[];
    /**
     * Path of the manifest files that should be read and augmented with the
     * integrity hash, relative to `outDir`.
     *
     * @default ['manifest.json', 'manifest-assets.json']
     */
    manifestPaths?: string[];
}
declare module 'vite' {
    interface ManifestChunk {
        integrity: string;
    }
}
declare function manifestSRI(options?: Options): Plugin;
declare function calculateIntegrityHash(source: Buffer, algorithm: string): string;

export { Algorithm, Options, calculateIntegrityHash, manifestSRI as default };
