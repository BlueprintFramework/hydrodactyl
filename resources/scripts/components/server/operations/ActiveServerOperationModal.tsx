import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getGlobalDaemonType } from '@/api/server/getServer';
import { getOperationStatus, getServerOperations, type ServerOperation } from '@/api/server/serverOperations';
import OperationProgressModal from '@/components/server/operations/OperationProgressModal';
import WingsOperationProgressModal from '@/components/server/operations/WingsOperationProgressModal';
import { useTranslation } from '@/i18n/I18nProvider';
import {
    clearRememberedServerOperation,
    isTrackedOperationType,
    readRememberedServerOperation,
    TRACKED_OPERATION_TYPES,
    type TrackedOperationType,
} from '@/lib/serverOperationTracker';
import { ServerContext } from '@/state/server';

/**
 * Survives hard refresh / navigation: if a software change or modpack install
 * is still pending/running, reopen the progress modal automatically.
 */
const ActiveServerOperationModal = () => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const daemonType = getGlobalDaemonType() ?? 'wings';

    const [operationId, setOperationId] = useState<string | null>(null);
    const [operationType, setOperationType] = useState<TrackedOperationType | null>(null);
    const [visible, setVisible] = useState(false);

    const open = useCallback((id: string, type: TrackedOperationType) => {
        setOperationId(id);
        setOperationType(type);
        setVisible(true);
    }, []);

    const close = useCallback(() => {
        if (uuid) clearRememberedServerOperation(uuid);
        setVisible(false);
        setOperationId(null);
        setOperationType(null);
    }, [uuid]);

    const restore = useCallback(async () => {
        if (!uuid) return;

        const remembered = readRememberedServerOperation(uuid);
        if (remembered) {
            try {
                const op = await getOperationStatus(uuid, remembered.operationId);
                if (op.is_active) {
                    open(remembered.operationId, remembered.type);
                    return;
                }
                clearRememberedServerOperation(uuid);
            } catch {
                clearRememberedServerOperation(uuid);
            }
        }

        try {
            const { operations } = await getServerOperations(uuid);
            const active = operations.find(
                (op) => op.is_active && isTrackedOperationType(op.type) && TRACKED_OPERATION_TYPES.includes(op.type),
            );
            if (active && isTrackedOperationType(active.type)) {
                open(active.operation_id, active.type);
            }
        } catch {
            // Non-fatal: page still works without restore.
        }
    }, [uuid, open]);

    useEffect(() => {
        void restore();
    }, [restore]);

    useEffect(() => {
        if (!uuid) return;

        const onTrack = (event: Event) => {
            const detail = (event as CustomEvent).detail as {
                uuid?: string;
                operationId?: string;
                type?: string;
            };
            if (detail?.uuid !== uuid || !detail.operationId || !isTrackedOperationType(detail.type ?? '')) return;
            open(detail.operationId, detail.type as TrackedOperationType);
        };

        const onClear = (event: Event) => {
            const detail = (event as CustomEvent).detail as { uuid?: string };
            if (detail?.uuid !== uuid) return;
            setVisible(false);
            setOperationId(null);
            setOperationType(null);
        };

        window.addEventListener('hd:server-operation', onTrack);
        window.addEventListener('hd:server-operation-clear', onClear);
        return () => {
            window.removeEventListener('hd:server-operation', onTrack);
            window.removeEventListener('hd:server-operation-clear', onClear);
        };
    }, [uuid, open]);

    const typeLabel =
        operationType === 'modpack_install' ? t('server.modpacks.operation_type') : t('server.software.operation_type');

    const handleComplete = useCallback(
        (operation: ServerOperation) => {
            if (uuid) clearRememberedServerOperation(uuid);
            window.dispatchEvent(
                new CustomEvent('hd:server-operation-finished', {
                    detail: { uuid, operation, type: operationType },
                }),
            );
            if (operation.is_completed) {
                toast.success(
                    operationType === 'modpack_install'
                        ? t('server.modpacks.operation_success')
                        : t('server.software.operation_success'),
                );
            } else if (operation.has_failed) {
                toast.error(
                    operation.message ||
                        (operationType === 'modpack_install'
                            ? t('server.modpacks.operation_failed')
                            : t('server.software.operation_failed')),
                );
            }
        },
        [uuid, operationType, t],
    );

    const handleError = useCallback(
        (error: Error) => {
            toast.error(error.message || t('server.software.operation_monitor_error'));
        },
        [t],
    );

    if (!uuid || !operationId || !operationType) {
        return null;
    }

    if (daemonType === 'elytra') {
        return (
            <OperationProgressModal
                visible={visible}
                operationId={operationId}
                operationType={typeLabel}
                onClose={close}
                onComplete={handleComplete}
                onError={handleError}
            />
        );
    }

    if (daemonType === 'wings' || daemonType === 'calagopus') {
        return (
            <WingsOperationProgressModal
                visible={visible}
                operationId={operationId}
                operationType={typeLabel}
                onClose={close}
                onComplete={handleComplete}
                onError={handleError}
            />
        );
    }

    return null;
};

export default ActiveServerOperationModal;
