import { FileArrowUp, Xmark } from '@gravity-ui/icons';
import { useContext, useEffect, useState } from 'react';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import asDialog from '@/hoc/asDialog';
import { bytesToString } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ServerContext } from '@/state/server';

const ProgressBar = ({ percent, className }: { percent: number; className?: string }) => (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[#ffffff12]', className)}>
        <div
            className='h-full rounded-full bg-brand transition-[width] duration-300 ease-out'
            style={{ width: `${percent}%` }}
        />
    </div>
);

const ProgressRing = ({ percent, size = 30, stroke = 3 }: { percent: number; size?: number; stroke?: number }) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className='-rotate-90' aria-hidden='true'>
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill='none'
                stroke='currentColor'
                strokeWidth={stroke}
                className='opacity-20'
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill='none'
                stroke='currentColor'
                strokeWidth={stroke}
                strokeLinecap='round'
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className='transition-all duration-300'
            />
        </svg>
    );
};

const FileUploadList = () => {
    const { close } = useContext(DialogWrapperContext);
    const cancelFileUpload = ServerContext.useStoreActions((actions) => actions.files.cancelFileUpload);
    const clearFileUploads = ServerContext.useStoreActions((actions) => actions.files.clearFileUploads);
    const uploads = ServerContext.useStoreState((state) =>
        Object.entries(state.files.uploads).sort(([a], [b]) => a.localeCompare(b)),
    );

    return (
        <TooltipProvider delayDuration={200}>
            <div className={'space-y-4 mt-5'}>
                {uploads.map(([name, file]) => {
                    const percent = file.total > 0 ? Math.min(100, (file.loaded / file.total) * 100) : 0;
                    const separator = name.lastIndexOf('/');
                    const basename = separator === -1 ? name : name.slice(separator + 1);
                    const folder = separator === -1 ? '' : name.slice(0, separator);

                    return (
                        <div
                            key={name}
                            className='rounded-xl border border-[#ffffff0e] bg-[#3333332a] p-3 transition-colors hover:border-[#ffffff1c]'
                        >
                            <div className='flex items-center gap-3'>
                                <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ffffff08] text-brand-400'>
                                    <FileArrowUp width={18} height={18} fill='currentColor' />
                                </div>
                                <div className='min-w-0 flex-1'>
                                    <div className='flex items-baseline justify-between gap-3'>
                                        <p className='truncate text-sm font-semibold text-neutral-200' title={name}>
                                            {basename}
                                        </p>
                                        <span className='shrink-0 text-xs font-semibold tabular-nums text-neutral-400'>
                                            {Math.floor(percent)}%
                                        </span>
                                    </div>
                                    {folder !== '' && <p className='truncate text-[11px] text-neutral-500'>{folder}</p>}
                                    <div className='mt-2 flex items-center gap-3'>
                                        <ProgressBar percent={percent} className='flex-1' />
                                        <span className='shrink-0 text-[11px] tabular-nums text-neutral-500'>
                                            {bytesToString(file.loaded)} / {bytesToString(file.total)}
                                        </span>
                                    </div>
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant='attention'
                                            size='sm'
                                            className='h-8 w-8 shrink-0 p-0'
                                            onClick={() => cancelFileUpload(name)}
                                            aria-label={`Cancel upload of ${basename}`}
                                        >
                                            <Xmark width={16} height={16} fill='currentColor' />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side='left'>Cancel upload</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    );
                })}
                <Dialog.Footer>
                    <Button variant='attention'>
                        Cancel all
                    </Button>
                    <Button variant='secondary' onClick={close}>
                        Hide
                    </Button>
                </Dialog.Footer>
            </div>
        </TooltipProvider>
    );
};

const FileUploadListDialog = asDialog({
    title: 'File Uploads',
    description: 'Files are transferring to your server.',
})(FileUploadList);

const FileManagerStatus = () => {
    const [open, setOpen] = useState(false);

    const count = ServerContext.useStoreState((state) => Object.keys(state.files.uploads).length);
    const overall = ServerContext.useStoreState((state) => {
        const uploads = Object.values(state.files.uploads);
        const total = uploads.reduce((sum, upload) => sum + upload.total, 0);
        const loaded = uploads.reduce((sum, upload) => sum + upload.loaded, 0);

        return total > 0 ? Math.round((loaded / total) * 100) : 0;
    });

    useEffect(() => {
        if (count === 0) {
            setOpen(false);
        }
    }, [count]);

    return (
        <TooltipProvider delayDuration={200}>
            {count > 0 && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant='secondary'
                            size='sm'
                            className='relative h-10 w-10 p-0'
                            onClick={() => setOpen(true)}
                        >
                            <ProgressRing percent={overall} />
                            <span className='absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums text-cream-400'>
                                {overall}%
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side='top'>
                        {count} {count === 1 ? 'file' : 'files'} uploading — click to view
                    </TooltipContent>
                </Tooltip>
            )}
            <FileUploadListDialog open={open} onClose={() => setOpen(false)} />
        </TooltipProvider>
    );
};

export default FileManagerStatus;
