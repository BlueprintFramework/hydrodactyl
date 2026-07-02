import { AntennaSignal, Check, CrownDiamond, Pencil, TrashBin, Xmark } from '@gravity-ui/icons';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import type { Allocation } from '@/api/server/getServer';
import deleteServerAllocation from '@/api/server/network/deleteServerAllocation';
import setPrimaryServerAllocation from '@/api/server/network/setPrimaryServerAllocation';
import setServerAllocationNotes from '@/api/server/network/setServerAllocationNotes';
import getServerAllocations from '@/api/swr/getServerAllocations';
import Can from '@/components/elements/Can';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Dialog } from '@/components/elements/dialog';
import { Textarea } from '@/components/elements/Input';
import InputSpinner from '@/components/elements/InputSpinner';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { ip } from '@/lib/formatters';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface Props {
    allocation: Allocation;
}

const AllocationRow = ({ allocation }: Props) => {
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notesValue, setNotesValue] = useState(allocation.notes || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = getServerAllocations();

    const onNotesChanged = useCallback(
        (id: number, notes: string) => {
            mutate((data) => data?.map((a) => (a.id === id ? { ...a, notes } : a)), false);
        },
        [mutate],
    );

    const saveNotes = useCallback(() => {
        setLoading(true);
        clearFlashes();

        setServerAllocationNotes(uuid, allocation.id, notesValue)
            .then(() => {
                onNotesChanged(allocation.id, notesValue);
                setIsEditingNotes(false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    }, [uuid, allocation.id, notesValue, onNotesChanged, clearFlashes, clearAndAddHttpError]);

    const cancelEdit = useCallback(() => {
        setNotesValue(allocation.notes || '');
        setIsEditingNotes(false);
    }, [allocation.notes]);

    const startEdit = useCallback(() => {
        setIsEditingNotes(true);
        setTimeout(() => textareaRef.current?.focus(), 0);
    }, []);

    useEffect(() => {
        setNotesValue(allocation.notes || '');
    }, [allocation.notes]);

    // Format the full allocation string for copying
    const allocationString = allocation.alias
        ? `${allocation.alias}:${allocation.port}`
        : `${ip(allocation.ip)}:${allocation.port}`;

    const setPrimaryAllocation = () => {
        clearFlashes();
        mutate((data) => data?.map((a) => ({ ...a, isDefault: a.id === allocation.id })), false);

        setPrimaryServerAllocation(uuid, allocation.id).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    const deleteAllocation = () => {
        setShowDeleteDialog(false);
        clearFlashes();
        setDeleteLoading(true);

        deleteServerAllocation(uuid, allocation.id)
            .then(() => {
                mutate((data) => data?.filter((a) => a.id !== allocation.id), false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setDeleteLoading(false));
    };

    return (
        <>
            <div className='flex items-center gap-3 w-full'>
                <div className='flex-shrink-0 w-5' />

                <div className='flex-shrink-0 w-9 h-9 rounded-lg bg-[#ffffff11] flex items-center justify-center'>
                    <AntennaSignal width={22} height={22} fill='currentColor' className='text-zinc-400' />
                </div>

                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1.5'>
                        <CopyOnClick text={allocationString}>
                            <h3 className='text-sm font-medium text-zinc-100 font-mono truncate cursor-pointer hover:text-zinc-50 transition-colors'>
                                {allocation.alias ? allocation.alias : ip(allocation.ip)}:{allocation.port}
                            </h3>
                        </CopyOnClick>
                        {allocation.isDefault && (
                            <span className='flex items-center gap-1 text-xs text-brand font-medium bg-brand/10 px-2 py-0.5 rounded'>
                                <CrownDiamond width={14} height={14} fill='currentColor' />
                                Primary
                            </span>
                        )}
                    </div>

                    {isEditingNotes ? (
                        <div className='space-y-2'>
                            <InputSpinner visible={loading}>
                                <Textarea
                                    ref={textareaRef}
                                    className='w-full bg-[#ffffff06] border border-[#ffffff08] rounded-lg p-3 text-sm text-zinc-300 placeholder-zinc-500 resize-none focus:ring-1 focus:ring-[#ffffff20] focus:border-[#ffffff20] transition-all'
                                    placeholder='Add notes for this allocation...'
                                    value={notesValue}
                                    onChange={(e) => setNotesValue(e.currentTarget.value)}
                                    rows={2}
                                />
                            </InputSpinner>
                            <div className='flex items-center gap-2'>
                                <Button variant='secondary' size='sm' onClick={saveNotes} disabled={loading}>
                                    {loading ? (
                                        <Spinner size='small' />
                                    ) : (
                                        <Check fill='currentColor' className='w-3 h-3 mr-1' />
                                    )}
                                    Save
                                </Button>
                                <Button variant='secondary' size='sm' onClick={cancelEdit} disabled={loading}>
                                    <Xmark width={22} height={22} fill='currentColor' className='mr-1' />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Can action={'allocation.update'}>
                            <button
                                onClick={startEdit}
                                className='w-full text-left text-xs text-zinc-500 truncate hover:text-zinc-300 transition-colors'
                            >
                                {allocation.notes || 'Click to add notes...'}
                            </button>
                        </Can>
                    )}
                </div>

                <div className='flex-shrink-0 flex items-center gap-2 min-w-[68px] justify-end'>
                    <Can action={'allocation.update'}>
                        <Button
                            onClick={setPrimaryAllocation}
                            disabled={allocation.isDefault}
                            variant={'secondary'}
                            className={`p-2  transition-colors ${
                                allocation.isDefault ? ' text-zinc-600 cursor-not-allowed' : ' text-zinc-400'
                            }`}
                            title={
                                allocation.isDefault
                                    ? 'This is already the primary allocation'
                                    : 'Make this the primary allocation'
                            }
                        >
                            <CrownDiamond width={22} height={22} fill='currentColor' />
                        </Button>
                    </Can>
                    <Can action={'allocation.delete'}>
                        <Button
                            onClick={() => setShowDeleteDialog(true)}
                            disabled={allocation.isDefault || deleteLoading}
                            variant={`${allocation.isDefault ? 'secondary' : 'attention'}`}
                            className={`p-2 border transition-colors`}
                            title={
                                allocation.isDefault ? 'Cannot delete the primary allocation' : 'Delete this allocation'
                            }
                        >
                            {deleteLoading ? (
                                <Spinner size='small' />
                            ) : (
                                <TrashBin width={22} height={22} fill='currentColor' />
                            )}
                        </Button>
                    </Can>
                </div>
            </div>
            <Dialog.Confirm
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                title={'Delete Allocation'}
                confirm={'Delete'}
                onConfirmed={deleteAllocation}
            >
                Are you sure you want to delete this allocation? This action cannot be undone.
            </Dialog.Confirm>
        </>
    );
};

export default memo(AllocationRow, isEqual);
