import { TriangleExclamation } from '@gravity-ui/icons';
import type React from 'react';
import { useEffect, useState } from 'react';
import { type OperationStatus, type ServerOperation, useOperationPolling } from '@/api/server/serverOperations';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/types';
import {
    canCloseOperation,
    formatOperationId,
    getStatusIconType,
    getStatusStyling,
    isActiveStatus,
    isCompletedStatus,
    isFailedStatus,
    UI_CONFIG,
} from '@/lib/server-operations';

import { ServerContext } from '@/state/server';

const STATUS_LABEL_KEYS: Record<OperationStatus, TranslationKey> = {
    pending: 'server.operations.status_pending',
    running: 'server.operations.status_running',
    completed: 'server.operations.status_completed',
    failed: 'server.operations.status_failed',
    cancelled: 'server.operations.status_cancelled',
};

interface Props {
    visible: boolean;
    operationId: string | null;
    operationType: string;
    onClose: () => void;
    onComplete?: (operation: ServerOperation) => void;
    onError?: (error: Error) => void;
}

/**
 * Modal component for displaying server operation progress in real-time.
 * Handles polling, auto-close, and status updates for long-running operations.
 */
const OperationProgressModal: React.FC<Props> = ({
    visible,
    operationId,
    operationType,
    onClose,
    onComplete,
    onError,
}) => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const [operation, setOperation] = useState<ServerOperation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);
    const { startPolling, stopPolling } = useOperationPolling();

    useEffect(() => {
        if (!visible || !operationId) {
            stopPolling(operationId || '');
            setOperation(null);
            setError(null);
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
                setAutoCloseTimer(null);
            }
            return;
        }

        const handleUpdate = (op: ServerOperation) => {
            setOperation(op);
        };

        const handleComplete = (op: ServerOperation) => {
            setOperation(op);
            stopPolling(operationId);

            if (onComplete) {
                onComplete(op);
            }

            if (op.is_completed) {
                const timer = setTimeout(() => {
                    onClose();
                }, UI_CONFIG.AUTO_CLOSE_DELAY);
                setAutoCloseTimer(timer);
            }
        };

        const handleError = (err: Error) => {
            setError(err.message);
            stopPolling(operationId);

            if (onError) {
                onError(err);
            }
        };

        startPolling(uuid, operationId, handleUpdate, handleComplete, handleError);

        return () => {
            stopPolling(operationId);
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
            }
        };
    }, [visible, operationId, uuid, startPolling, stopPolling, onComplete, onError, onClose, autoCloseTimer]);

    const renderStatusIcon = (status: string) => {
        const iconType = getStatusIconType(status as OperationStatus);

        switch (iconType) {
            case 'spinner':
                return <Spinner size={'small'} />;
            case 'success':
                return (
                    <div className='w-5 h-5 rounded-full bg-green-400 flex items-center justify-center'>
                        <div className='w-2 h-2 rounded-full bg-white' />
                    </div>
                );
            case 'error':
                return (
                    <TriangleExclamation width={22} height={22} fill='currentColor' className='w-5 h-5 text-red-400' />
                );
            default:
                return <Spinner size={'small'} />;
        }
    };

    const canClose = canCloseOperation(operation, error);
    const statusStyling = operation ? getStatusStyling(operation.status) : null;

    const handleClose = () => {
        if (autoCloseTimer) {
            clearTimeout(autoCloseTimer);
            setAutoCloseTimer(null);
        }
        onClose();
    };

    return (
        <Dialog
            open={visible}
            onClose={canClose ? handleClose : () => undefined}
            preventExternalClose={!canClose}
            hideCloseIcon={!canClose}
            title={operationType}
        >
            <div className='space-y-4'>
                {/* Operation ID */}
                {operationId && (
                    <div className='flex justify-center'>
                        <div className='px-3 py-1.5 bg-[#ffffff11] border border-[#ffffff12] rounded-lg'>
                            <p className='text-xs text-zinc-400 font-mono'>
                                {t('server.operations.id')} {formatOperationId(operationId)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error ? (
                    <div className='space-y-4'>
                        <div className='flex items-center justify-center space-x-3'>
                            <TriangleExclamation
                                width={22}
                                height={22}
                                fill='currentColor'
                                className='w-6 h-6 text-red-400'
                            />
                            <span className='text-red-400 font-semibold text-lg'>{t('common.error')}</span>
                        </div>
                        <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
                            <p className='text-sm text-red-300'>{error}</p>
                        </div>
                    </div>
                ) : operation ? (
                    /* Operation State */
                    <div className='space-y-4'>
                        {/* Status Header */}
                        <div className='flex items-center justify-center space-x-3'>
                            {renderStatusIcon(operation.status)}
                            <span className={`font-semibold text-lg ${statusStyling?.color || 'text-zinc-300'}`}>
                                {t(STATUS_LABEL_KEYS[operation.status])}
                            </span>
                        </div>

                        {/* Message Box */}
                        <div className='p-4 bg-[#ffffff11] border border-[#ffffff12] rounded-lg'>
                            <p className='text-sm text-zinc-300 text-center'>
                                {operation.message || t('server.operations.processing')}
                            </p>
                        </div>

                        {/* Progress Bar for Active Operations */}
                        {isActiveStatus(operation.status) && (
                            <div className='space-y-3'>
                                <div className='w-full bg-[#ffffff11] rounded-full h-2 border border-[#ffffff12]'>
                                    <div
                                        className='bg-brand h-2 rounded-full animate-pulse transition-all duration-500 ease-out'
                                        style={{ width: `${UI_CONFIG.ESTIMATED_PROGRESS_WIDTH}%` }}
                                    />
                                </div>
                                <p className='text-xs text-zinc-500 text-center'>
                                    {t('server.operations.auto_close_notice')}
                                </p>
                            </div>
                        )}

                        {/* Success State */}
                        {isCompletedStatus(operation.status) && (
                            <div className='p-4 bg-green-500/10 border border-green-500/20 rounded-lg'>
                                <div className='flex items-center justify-center space-x-2 mb-2'>
                                    <div className='w-5 h-5 rounded-full bg-green-400 flex items-center justify-center'>
                                        <div className='w-2 h-2 rounded-full bg-white' />
                                    </div>
                                    <p className='text-sm text-green-300 font-medium'>
                                        {t('server.operations.completed')}
                                    </p>
                                </div>
                                {autoCloseTimer && (
                                    <p className='text-xs text-green-200 text-center'>
                                        {t('server.operations.closing_automatically')}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Failed State */}
                        {isFailedStatus(operation.status) && (
                            <div className='p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
                                <div className='flex items-center justify-center space-x-2 mb-2'>
                                    <TriangleExclamation
                                        width={22}
                                        height={22}
                                        fill='currentColor'
                                        className='w-5 h-5 text-red-400'
                                    />
                                    <p className='text-sm text-red-300 font-medium'>{t('server.operations.failed')}</p>
                                </div>
                                {operation.message && (
                                    <p className='text-xs text-red-200 text-center'>{operation.message}</p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Loading State */
                    <div className='flex items-center justify-center space-x-3 py-4'>
                        <Spinner size={'small'} />
                        <span className='text-zinc-400 font-medium'>{t('server.operations.initializing')}</span>
                    </div>
                )}
            </div>

            {canClose && (
                <Dialog.Footer>
                    <Button onClick={handleClose} variant='secondary'>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleClose} variant='attention'>
                        {operation?.is_completed ? t('common.done') : t('common.close')}
                    </Button>
                </Dialog.Footer>
            )}
        </Dialog>
    );
};

export default OperationProgressModal;
