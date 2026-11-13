import axios, { type AxiosProgressEvent } from 'axios';

/** Files at or above this size use parallel chunked uploads when Wings supports them. */
export const CHUNK_THRESHOLD_BYTES = 32 * 1024 * 1024;

/** Preferred chunk size; Wings accepts up to 16 MiB. */
export const CHUNK_SIZE_BYTES = 8 * 1024 * 1024;

/** Parallel chunk HTTP connections per large file. */
export const CHUNKS_PER_FILE = 8;

export const GLOBAL_CONNECTION_BUDGET = 8;

/** Max large files uploading at once (each may use up to CHUNKS_PER_FILE connections). */
export const MAX_CONCURRENT_LARGE_FILES = 2;

type SessionResponse = {
    upload_id: string;
    chunk_size?: number;
};

const parseUploadEndpoint = (signedUploadUrl: string) => {
    const url = new URL(signedUploadUrl);
    const token = url.searchParams.get('token');
    if (!token) {
        throw new Error('Upload URL is missing a token.');
    }

    return {
        origin: url.origin,
        token,
    };
};

const sessionUrl = (origin: string, token: string, directory: string) => {
    const url = new URL('/upload/file/session', origin);
    url.searchParams.set('token', token);
    url.searchParams.set('directory', directory);
    return url.toString();
};

const chunkUrl = (origin: string, uploadId: string, offset: number, length: number) => {
    const url = new URL('/upload/file/chunk', origin);
    url.searchParams.set('upload_id', uploadId);
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('length', String(length));
    return url.toString();
};

const completeUrl = (origin: string, uploadId: string) => {
    const url = new URL('/upload/file/complete', origin);
    url.searchParams.set('upload_id', uploadId);
    return url.toString();
};

const cancelUrl = (origin: string, uploadId: string) => {
    const url = new URL('/upload/file/session', origin);
    url.searchParams.set('upload_id', uploadId);
    return url.toString();
};

export class ChunkedUploadUnsupportedError extends Error {
    constructor() {
        super('Chunked uploads are not supported by this Wings node.');
        this.name = 'ChunkedUploadUnsupportedError';
    }
}

/**
 * Upload a large file using Wings session/chunk/complete endpoints.
 * Throws ChunkedUploadUnsupportedError when the node does not expose the API.
 */
export async function uploadFileChunked(options: {
    signedUploadUrl: string;
    file: File;
    directory: string;
    signal: AbortSignal;
    onProgress: (loaded: number) => void;
    connectionSlots?: number;
}): Promise<void> {
    const { signedUploadUrl, file, directory, signal, onProgress } = options;
    const workers = Math.max(1, Math.min(options.connectionSlots ?? CHUNKS_PER_FILE, CHUNKS_PER_FILE));
    const { origin, token } = parseUploadEndpoint(signedUploadUrl);

    let uploadId: string | undefined;

    const cancelSession = async () => {
        if (!uploadId) {
            return;
        }
        try {
            await axios.delete(cancelUrl(origin, uploadId), { timeout: 15_000 });
        } catch {
            // Best-effort cleanup when the browser aborts or the session already expired.
        }
    };

    const onAbort = () => {
        void cancelSession();
    };
    signal.addEventListener('abort', onAbort);

    try {
        let sessionResponse: { data: SessionResponse };
        try {
            sessionResponse = await axios.post<SessionResponse>(
                sessionUrl(origin, token, directory),
                { name: file.name, size: file.size },
                {
                    signal,
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30_000,
                },
            );
        } catch (error) {
            if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 405)) {
                throw new ChunkedUploadUnsupportedError();
            }
            throw error;
        }

        uploadId = sessionResponse.data.upload_id;
        if (!uploadId) {
            throw new Error('Wings did not return an upload_id.');
        }

        const chunkSize = Math.min(
            Math.max(1, sessionResponse.data.chunk_size ?? CHUNK_SIZE_BYTES),
            16 * 1024 * 1024,
            CHUNK_SIZE_BYTES,
        );

        const chunks: { offset: number; length: number }[] = [];
        for (let offset = 0; offset < file.size; offset += chunkSize) {
            chunks.push({ offset, length: Math.min(chunkSize, file.size - offset) });
        }

        let completedBytes = 0;
        const inflight = new Map<number, number>();
        const reportProgress = () => {
            let extra = 0;
            for (const loaded of inflight.values()) {
                extra += loaded;
            }
            onProgress(Math.min(file.size, completedBytes + extra));
        };

        let cursor = 0;
        let failed: unknown;

        const runWorker = async () => {
            while (!failed) {
                const index = cursor++;
                if (index >= chunks.length) {
                    return;
                }

                const chunk = chunks[index];
                if (!chunk || !uploadId) {
                    return;
                }

                const blob = file.slice(chunk.offset, chunk.offset + chunk.length);
                try {
                    await axios.put(chunkUrl(origin, uploadId, chunk.offset, chunk.length), blob, {
                        signal,
                        headers: { 'Content-Type': 'application/octet-stream' },
                        timeout: 0,
                        maxBodyLength: Infinity,
                        maxContentLength: Infinity,
                        onUploadProgress: (event: AxiosProgressEvent) => {
                            inflight.set(index, event.loaded ?? 0);
                            reportProgress();
                        },
                    });
                    inflight.delete(index);
                    completedBytes += chunk.length;
                    reportProgress();
                } catch (error) {
                    inflight.delete(index);
                    failed = error;
                    throw error;
                }
            }
        };

        await Promise.all(Array.from({ length: Math.min(workers, chunks.length) }, () => runWorker()));

        if (failed) {
            throw failed;
        }

        await axios.post(completeUrl(origin, uploadId), null, {
            signal,
            timeout: 120_000,
        });
        onProgress(file.size);
    } catch (error) {
        if (signal.aborted || axios.isCancel(error)) {
            await cancelSession();
        } else if (uploadId) {
            await cancelSession();
        }
        throw error;
    } finally {
        signal.removeEventListener('abort', onAbort);
    }
}

/**
 * Classic single-connection multipart upload used for small files and as a fallback.
 */
export async function uploadFileMultipart(options: {
    signedUploadUrl: string;
    file: File;
    directory: string;
    signal: AbortSignal;
    onProgress: (loaded: number) => void;
}): Promise<void> {
    const { signedUploadUrl, file, directory, signal, onProgress } = options;
    await axios.post(
        signedUploadUrl,
        { files: file },
        {
            signal,
            headers: { 'Content-Type': 'multipart/form-data' },
            params: { directory },
            timeout: 0,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            onUploadProgress: (event) => onProgress(event.loaded),
        },
    );
}
