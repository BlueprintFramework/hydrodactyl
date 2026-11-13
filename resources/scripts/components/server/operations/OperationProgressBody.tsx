import { useEffect, useRef } from 'react';
import type { ServerOperation } from '@/api/server/serverOperations';
import { useTranslation } from '@/i18n/I18nProvider';
import { isActiveStatus, UI_CONFIG } from '@/lib/server-operations';

export interface OperationProgressMeta {
    percent?: number;
    current?: string | null;
    recent?: string[];
    log?: Array<{ at?: string; text: string } | string>;
    done?: number;
    total?: number;
    stage?: string;
}

export const readOperationProgress = (operation: ServerOperation | null): OperationProgressMeta | null => {
    const raw = operation?.parameters?.progress;
    if (!raw || typeof raw !== 'object') return null;
    return raw as OperationProgressMeta;
};

interface Props {
    operation: ServerOperation;
}

const normalizeLog = (progress: OperationProgressMeta | null): string[] => {
    if (!progress) return [];
    const fromLog = Array.isArray(progress.log)
        ? progress.log
              .map((entry) => (typeof entry === 'string' ? entry : entry?.text))
              .filter((text): text is string => typeof text === 'string' && text.trim() !== '')
        : [];
    if (fromLog.length > 0) {
        // Stored newest-first; show oldest→newest in the console.
        return fromLog.slice(0, 40).reverse();
    }
    const recent = Array.isArray(progress.recent) ? progress.recent.slice(0, 24) : [];
    return recent.slice().reverse();
};

/**
 * Shared progress details: real percent when the job reports it, plus a soft
 * live console (mods/files/stages) that scrolls as the install advances.
 */
const OperationProgressBody = ({ operation }: Props) => {
    const { t } = useTranslation();
    const progress = readOperationProgress(operation);
    const active = isActiveStatus(operation.status);
    const percent =
        typeof progress?.percent === 'number'
            ? Math.max(0, Math.min(100, Math.round(progress.percent)))
            : active
              ? UI_CONFIG.ESTIMATED_PROGRESS_WIDTH
              : operation.is_completed
                ? 100
                : null;
    const logLines = normalizeLog(progress);
    const hasCounts = typeof progress?.done === 'number' && typeof progress?.total === 'number' && progress.total > 0;
    const consoleRef = useRef<HTMLDivElement>(null);
    const logSignature = logLines.join('\n');

    useEffect(() => {
        const el = consoleRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [logSignature]);

    if (!active && !operation.is_completed) {
        return null;
    }

    return (
        <div className='space-y-3'>
            {percent !== null && (
                <div className='space-y-2'>
                    <div className='flex items-center justify-between text-xs text-zinc-400'>
                        <span>
                            {hasCounts
                                ? t('server.operations.files_progress', {
                                      done: progress?.done ?? 0,
                                      total: progress?.total ?? 0,
                                  })
                                : t('server.operations.progress_label')}
                        </span>
                        <span className='font-mono text-cream-100'>{percent}%</span>
                    </div>
                    <div className='h-2 w-full overflow-hidden rounded-full border border-[#ffffff12] bg-[#ffffff11]'>
                        <div
                            className={`bg-brand h-full rounded-full transition-all duration-500 ease-out ${
                                active && !progress?.percent ? 'animate-pulse' : ''
                            }`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
            )}

            {(active || logLines.length > 0) && (
                <div className='overflow-hidden rounded-xl border border-[#ffffff14] bg-[#0b0c10]'>
                    <div className='flex items-center justify-between border-b border-[#ffffff10] px-3 py-1.5'>
                        <span className='text-[11px] uppercase tracking-wide text-zinc-500'>
                            {t('server.operations.live_console')}
                        </span>
                        {active ? (
                            <span className='flex items-center gap-1.5 text-[10px] text-emerald-400/80'>
                                <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400' />
                                {t('server.operations.live_console_live')}
                            </span>
                        ) : null}
                    </div>
                    <div
                        ref={consoleRef}
                        className='max-h-40 space-y-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-400'
                    >
                        {logLines.length === 0 && active ? (
                            <p className='text-zinc-600'>{operation.message || t('server.operations.processing')}</p>
                        ) : null}
                        {logLines.map((line, index) => (
                            <p
                                key={`${index}-${line}`}
                                className={index === logLines.length - 1 && active ? 'text-cream-100' : 'text-zinc-500'}
                                title={line}
                            >
                                <span className='mr-2 select-none text-zinc-700'>›</span>
                                {line}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {active ? (
                <p className='text-center text-xs text-zinc-500'>{t('server.operations.auto_close_notice')}</p>
            ) : null}
        </div>
    );
};

export default OperationProgressBody;
