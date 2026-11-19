export type TrackedOperationType = 'egg_change' | 'modpack_install';

export interface TrackedServerOperation {
    operationId: string;
    type: TrackedOperationType;
    at: number;
}

const storageKey = (uuid: string) => `hd:server-op:${uuid}`;

export const TRACKED_OPERATION_TYPES: TrackedOperationType[] = ['egg_change', 'modpack_install'];

export const isTrackedOperationType = (type: string): type is TrackedOperationType =>
    TRACKED_OPERATION_TYPES.includes(type as TrackedOperationType);

export function rememberServerOperation(uuid: string, operationId: string, type: TrackedOperationType): void {
    const payload: TrackedServerOperation = { operationId, type, at: Date.now() };
    try {
        sessionStorage.setItem(storageKey(uuid), JSON.stringify(payload));
    } catch {
        // Private mode / quota — API restore still works.
    }
    window.dispatchEvent(new CustomEvent('hd:server-operation', { detail: { uuid, ...payload } }));
}

export function clearRememberedServerOperation(uuid: string): void {
    try {
        sessionStorage.removeItem(storageKey(uuid));
    } catch {
        // ignore
    }
    window.dispatchEvent(new CustomEvent('hd:server-operation-clear', { detail: { uuid } }));
}

export function readRememberedServerOperation(uuid: string): TrackedServerOperation | null {
    try {
        const raw = sessionStorage.getItem(storageKey(uuid));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as TrackedServerOperation;
        if (!parsed?.operationId || !isTrackedOperationType(parsed.type)) return null;
        return parsed;
    } catch {
        return null;
    }
}
