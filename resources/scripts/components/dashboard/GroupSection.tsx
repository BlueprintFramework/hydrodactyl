import { ArrowDownToLine, EllipsisVertical, FolderOpen, Pencil, Plus, TrashBin } from '@gravity-ui/icons';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import type { Server } from '@/api/server/getServer';
import getServerGroups, {
    addServersToGroup,
    deleteServerGroup,
    removeServersFromGroup,
    updateServerGroup,
} from '@/api/serverGroups';
import CreateGroupModal from '@/components/dashboard/CreateGroupModal';
import ServerRow from '@/components/dashboard/ServerRow';
import { Dialog } from '@/components/elements/dialog';
import Input, { Textarea } from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

interface GroupSectionProps {
    servers: Server[];
    displayOption: 'list' | 'grid';
    groupFilterId?: number;
    filterActive?: boolean;
}

const serverRowClassName = (displayOption: 'list' | 'grid') =>
    displayOption === 'list' ? 'flex-row' : 'items-start! flex-col w-full gap-4 [&>div~div]:w-full';

interface DraggableServerProps {
    server: Server;
    displayOption: 'list' | 'grid';
    index: number;
    isDragging: boolean;
    onDragStart: (event: React.DragEvent, server: Server) => void;
    onDragEnd: (event: React.DragEvent) => void;
}

const DraggableServer = memo(
    ({ server, displayOption, index, isDragging, onDragStart, onDragEnd }: DraggableServerProps) => (
        // biome-ignore lint/a11y/noStaticElementInteractions: Draggable server row
        <div
            draggable
            onDragStart={(event) => onDragStart(event, server)}
            onDragEnd={onDragEnd}
            className={cn('transform-gpu transition-opacity', isDragging && 'opacity-40')}
            style={{ animationDelay: `${index * 30}ms` }}
        >
            <ServerRow className={serverRowClassName(displayOption)} server={server} hideGroup />
        </div>
    ),
);
DraggableServer.displayName = 'DraggableServer';

const GroupSection = ({ servers, displayOption, groupFilterId, filterActive }: GroupSectionProps) => {
    const { t } = useTranslation();
    const { data: groups, mutate: mutateGroups } = useSWR('server-groups', () => getServerGroups());
    const { mutate } = useSWRConfig();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [renamingGroup, setRenamingGroup] = useState<{ id: number; name: string; description?: string } | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [renameDescription, setRenameDescription] = useState('');
    const [deletingGroup, setDeletingGroup] = useState<{ id: number; name: string } | null>(null);
    const [dragOverGroupId, setDragOverGroupId] = useState<number | null>(null);
    const [dragOverUngrouped, setDragOverUngrouped] = useState(false);
    const [draggingServerId, setDraggingServerId] = useState<string | null>(null);

    const previewRef = useRef<HTMLDivElement>(null);
    const previewNameRef = useRef<HTMLSpanElement>(null);

    const revalidateServers = useCallback(() => {
        mutate((key: unknown) => Array.isArray(key) && key[0] === '/api/client/servers');
    }, [mutate]);

    const ungroupedServers = useMemo(() => {
        return servers.filter((s) => !s.group);
    }, [servers]);

    const serversByGroup = useMemo(() => {
        if (!groups) return {};
        const map: Record<number, Server[]> = {};
        for (const group of groups) {
            map[group.id] = servers.filter((s) => s.group?.id === group.id);
        }
        return map;
    }, [servers, groups]);

    const visibleGroups = useMemo(() => {
        if (!groups) return [];
        if (groupFilterId != null) return groups.filter((g) => g.id === groupFilterId);
        if (filterActive) return groups.filter((g) => (serversByGroup[g.id]?.length ?? 0) > 0);
        return groups;
    }, [groups, groupFilterId, filterActive, serversByGroup]);

    const handleDragStart = useCallback((event: React.DragEvent, server: Server) => {
        event.dataTransfer.setData('text/plain', server.id);
        event.dataTransfer.effectAllowed = 'move';
        setDraggingServerId(server.id);

        const preview = previewRef.current;
        if (preview && previewNameRef.current) {
            previewNameRef.current.textContent = server.name;
            event.dataTransfer.setDragImage(preview, 24, 24);
        }
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent, groupId: number) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDragOverGroupId(groupId);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOverGroupId(null);
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggingServerId(null);
    }, []);

    const handleDrop = useCallback(
        async (event: React.DragEvent, groupId: number) => {
            event.preventDefault();
            setDragOverGroupId(null);
            const serverId = event.dataTransfer.getData('text/plain');
            if (!serverId) return;

            const server = servers.find((s) => s.id === serverId);
            if (!server) return;

            await addServersToGroup(groupId, [server.internalId as number]);
            mutateGroups();
            revalidateServers();
        },
        [servers, mutateGroups, revalidateServers],
    );

    const handleDropToUngrouped = useCallback(
        async (event: React.DragEvent) => {
            event.preventDefault();
            setDragOverUngrouped(false);
            const serverId = event.dataTransfer.getData('text/plain');
            if (!serverId) return;

            const server = servers.find((s) => s.id === serverId);
            if (!server?.group) return;

            await removeServersFromGroup(server.group.id, [server.internalId as number]);
            mutateGroups();
            revalidateServers();
        },
        [servers, mutateGroups, revalidateServers],
    );

    const handleRename = useCallback(async () => {
        if (!renamingGroup || !renameValue.trim()) return;
        await updateServerGroup(renamingGroup.id, {
            name: renameValue.trim(),
            description: renameDescription.trim() || null,
        });
        mutateGroups();
        setRenamingGroup(null);
        setRenameValue('');
        setRenameDescription('');
    }, [renamingGroup, renameValue, renameDescription, mutateGroups]);

    const handleDelete = useCallback(async () => {
        if (!deletingGroup) return;
        await deleteServerGroup(deletingGroup.id);
        mutateGroups();
        revalidateServers();
        setDeletingGroup(null);
    }, [deletingGroup, mutateGroups, revalidateServers]);

    const handleToggleCollapse = useCallback(
        async (groupId: number, current: boolean) => {
            await updateServerGroup(groupId, { is_collapsed: !current });
            mutateGroups();
        },
        [mutateGroups],
    );

    const dragPreview = (
        <div
            ref={previewRef}
            aria-hidden
            className='pointer-events-none fixed -left-[9999px] top-0 z-50 flex w-72 items-center gap-3 rounded-xl border border-cream-500/30 bg-mocha-500 px-4 py-3 shadow-lg shadow-black/50'
        >
            <span className='size-2.5 shrink-0 rounded-full bg-cream-400' />
            <span ref={previewNameRef} className='truncate text-sm font-semibold text-cream-200' />
        </div>
    );

    if (!groups || groups.length === 0) {
        return (
            <>
                <div className='flex flex-col items-center justify-center py-16 text-center'>
                    <div className='size-16 rounded-2xl bg-mocha-500/50 flex items-center justify-center mb-4'>
                        <FolderOpen className='size-8 text-cream-200/60' />
                    </div>
                    <p className='text-sm font-medium text-cream-200 mb-1'>{t('dashboard.groups.empty.title')}</p>
                    <p className='text-xs text-cream-200/40 mb-5 max-w-xs'>{t('dashboard.groups.empty.description')}</p>
                    <button
                        type='button'
                        onClick={() => setShowCreateModal(true)}
                        className='flex items-center gap-2 px-4 py-2 bg-cream-400 text-mocha-500 hover:bg-cream-500/80 rounded-lg text-sm font-medium transition-colors'
                    >
                        <Plus className='size-4' />
                        {t('dashboard.groups.create')}
                    </button>
                </div>
                {ungroupedServers.length > 0 && (
                    <div className='rounded-xl border border-cream-500/20 bg-mocha-500/30 overflow-hidden'>
                        <div className='px-4 py-3 border-b border-cream-500/20'>
                            <span className='text-xs font-medium text-cream-200/50 uppercase tracking-wider'>
                                {t('dashboard.groups.ungrouped')}
                            </span>
                            <span className='text-xs text-cream-200/40 ml-2'>{ungroupedServers.length}</span>
                        </div>
                        <div className='p-3 flex flex-col gap-3'>
                            {ungroupedServers.map((server, index) => (
                                <DraggableServer
                                    key={server.uuid}
                                    server={server}
                                    displayOption={displayOption}
                                    index={index}
                                    isDragging={draggingServerId === server.id}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                />
                            ))}
                        </div>
                    </div>
                )}
                {showCreateModal && (
                    <CreateGroupModal
                        onClose={() => setShowCreateModal(false)}
                        onCreated={() => {
                            setShowCreateModal(false);
                            mutateGroups();
                        }}
                    />
                )}
                {dragPreview}
            </>
        );
    }

    return (
        <>
            <div className='flex items-center justify-between gap-3 mb-6'>
                <div className='flex items-center gap-2 min-w-0'>
                    <h3 className='text-xs font-medium text-cream-200/50 uppercase tracking-wider shrink-0'>
                        {t('dashboard.groups.title')}
                    </h3>
                    <span className='text-xs text-cream-200/40'>{groups.length}</span>
                </div>
                <button
                    type='button'
                    onClick={() => setShowCreateModal(true)}
                    className='flex items-center gap-1.5 px-3 py-1.5 bg-cream-400 text-mocha-500 hover:bg-cream-500/80 rounded-lg text-xs font-medium transition-colors shrink-0'
                >
                    <Plus className='size-3.5' />
                    {t('dashboard.groups.new')}
                </button>
            </div>

            <div className='flex flex-col gap-6 sm:gap-8'>
                {visibleGroups.map((group, index) => {
                    const groupServers = serversByGroup[group.id] || [];
                    const isDragOver = dragOverGroupId === group.id;

                    return (
                        // biome-ignore lint/a11y/noStaticElementInteractions: Drag-and-drop group container
                        <div
                            key={group.id}
                            style={{ animationDelay: `${index * 60}ms` }}
                            className={cn(
                                'rounded-xl border transition-all duration-150 animate-group-fly-in',
                                isDragOver
                                    ? 'border-cream-500/40 bg-cream-400/[0.08] ring-1 ring-inset ring-cream-500/30'
                                    : 'border-cream-500/20 bg-mocha-500/30 hover:bg-mocha-500/40',
                            )}
                            onDragOver={(e) => handleDragOver(e, group.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, group.id)}
                        >
                            <div className='flex items-center justify-between gap-3 px-4 py-3 select-none'>
                                {/* biome-ignore lint/a11y/noStaticElementInteractions: Group collapse toggle */}
                                {/* biome-ignore lint/a11y/useKeyWithClickEvents: Handled via parent container */}
                                <div
                                    className='flex items-center gap-3 flex-1 min-w-0 cursor-pointer'
                                    onClick={() => handleToggleCollapse(group.id, group.is_collapsed)}
                                >
                                    <div
                                        className={cn(
                                            'transition-transform duration-200 shrink-0',
                                            !group.is_collapsed && 'rotate-90',
                                        )}
                                    >
                                        <FolderOpen className='size-4 text-cream-200/60' />
                                    </div>
                                    <span className='text-sm font-medium text-cream-200 truncate'>{group.name}</span>
                                    <span className='text-xs text-cream-200/40 tabular-nums'>
                                        {groupServers.length}
                                    </span>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type='button'
                                            className='p-1.5 text-cream-200/50 hover:text-cream-200 hover:bg-cream-500/10 transition-colors rounded-md shrink-0'
                                            title={t('dashboard.groups.options')}
                                        >
                                            <EllipsisVertical className='size-4' />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent sideOffset={4}>
                                        <DropdownMenuItem
                                            onSelect={() => {
                                                setRenamingGroup({
                                                    id: group.id,
                                                    name: group.name,
                                                    description: group.description ?? '',
                                                });
                                                setRenameValue(group.name);
                                                setRenameDescription(group.description ?? '');
                                            }}
                                        >
                                            <Pencil className='size-3.5 mr-2' />
                                            {t('common.edit')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={() => setDeletingGroup({ id: group.id, name: group.name })}
                                            className='text-red-400'
                                        >
                                            <TrashBin className='size-3.5 mr-2' />
                                            {t('common.delete')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {group.description && (
                                <p className='px-4 pb-3 -mt-1 text-xs text-cream-200/40'>{group.description}</p>
                            )}

                            <div
                                className={cn(
                                    'grid transition-all duration-200 ease-out',
                                    group.is_collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
                                )}
                            >
                                <div className='overflow-hidden min-h-0'>
                                    {groupServers.length > 0 ? (
                                        <div className='px-3 pb-3 flex flex-col gap-3'>
                                            {groupServers.map((server, index) => (
                                                <DraggableServer
                                                    key={server.uuid}
                                                    server={server}
                                                    displayOption={displayOption}
                                                    index={index}
                                                    isDragging={draggingServerId === server.id}
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className='px-4 pb-5 pt-1'>
                                            <p className='text-xs text-cream-200/40 text-center py-3'>
                                                {t('dashboard.groups.drag_to_add')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {groupFilterId == null && (ungroupedServers.length > 0 || !filterActive) && (
                    <div
                        role='option'
                        tabIndex={0}
                        style={{ animationDelay: `${visibleGroups.length * 60}ms` }}
                        className={cn(
                            'rounded-xl border border-dashed transition-all duration-150 overflow-hidden animate-group-fly-in',
                            dragOverUngrouped
                                ? 'border-cream-500/40 bg-cream-400/[0.08] ring-1 ring-inset ring-cream-500/30'
                                : ungroupedServers.length > 0
                                  ? 'border-cream-500/20 bg-mocha-500/20'
                                  : 'border-cream-500/10 bg-transparent',
                        )}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            setDragOverUngrouped(true);
                        }}
                        onDragLeave={() => setDragOverUngrouped(false)}
                        onDrop={handleDropToUngrouped}
                    >
                        {ungroupedServers.length > 0 ? (
                            <>
                                <div className='px-4 py-3 border-b border-cream-500/20 flex items-center gap-2'>
                                    <span className='text-xs font-medium text-cream-200/50 uppercase tracking-wider'>
                                        {t('dashboard.groups.ungrouped')}
                                    </span>
                                    <span className='text-xs text-cream-200/40 tabular-nums'>
                                        {ungroupedServers.length}
                                    </span>
                                </div>
                                <div className='p-3 flex flex-col gap-3'>
                                    {ungroupedServers.map((server, index) => (
                                        <DraggableServer
                                            key={server.uuid}
                                            server={server}
                                            displayOption={displayOption}
                                            index={index}
                                            isDragging={draggingServerId === server.id}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className='px-4 py-8 flex flex-col items-center justify-center text-center'>
                                {dragOverUngrouped ? <ArrowDownToLine className='size-5 text-cream-400 mb-3' /> : null}
                                <p className='text-xs text-cream-200/50'>
                                    {dragOverUngrouped
                                        ? t('dashboard.groups.drop_to_ungroup')
                                        : t('dashboard.groups.drag_to_ungroup')}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showCreateModal && (
                <CreateGroupModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        mutateGroups();
                    }}
                />
            )}

            {renamingGroup && (
                <Dialog open onClose={() => setRenamingGroup(null)} title={t('dashboard.groups.edit_title')}>
                    <div className='space-y-4 py-1'>
                        <div className='space-y-1.5'>
                            <Label className='text-sm text-cream-200/50'>{t('dashboard.groups.name_label')}</Label>
                            <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                placeholder={t('dashboard.groups.name_placeholder')}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (
                                        e.key === 'Enter' &&
                                        renameValue.trim() &&
                                        (renameValue.trim() !== renamingGroup.name ||
                                            renameDescription !== (renamingGroup.description ?? ''))
                                    ) {
                                        handleRename();
                                    }
                                }}
                                className='w-full'
                            />
                        </div>
                        <div className='space-y-1.5'>
                            <Label className='text-sm text-cream-200/50'>
                                {t('dashboard.groups.description_label')}
                            </Label>
                            <Textarea
                                value={renameDescription}
                                onChange={(e) => setRenameDescription(e.target.value)}
                                placeholder={t('dashboard.groups.description_placeholder')}
                                rows={3}
                                className='w-full'
                            />
                        </div>
                        <p className='text-xs text-cream-200/40'>{t('dashboard.groups.press_enter')}</p>
                    </div>
                    <Dialog.Footer>
                        <Button variant='secondary' onClick={() => setRenamingGroup(null)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant='attention'
                            onClick={handleRename}
                            disabled={
                                !renameValue.trim() ||
                                (renameValue.trim() === renamingGroup.name &&
                                    renameDescription === (renamingGroup.description ?? ''))
                            }
                        >
                            {t('common.save')}
                        </Button>
                    </Dialog.Footer>
                </Dialog>
            )}

            {deletingGroup && (
                <Dialog open onClose={() => setDeletingGroup(null)} title={t('dashboard.groups.delete_title')}>
                    {(() => {
                        const count = serversByGroup[deletingGroup.id]?.length ?? 0;

                        return (
                            <p className='text-sm text-cream-200/70 py-1'>
                                {t('dashboard.groups.delete_confirm')}{' '}
                                <strong className='text-cream-200'>{deletingGroup.name}</strong>
                                {t(
                                    count === 1
                                        ? 'dashboard.groups.delete_confirm_one'
                                        : 'dashboard.groups.delete_confirm_other',
                                    { count },
                                )}
                            </p>
                        );
                    })()}
                    <Dialog.Footer>
                        <Button variant='secondary' onClick={() => setDeletingGroup(null)}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant='destructive' onClick={handleDelete}>
                            {t('common.delete')}
                        </Button>
                    </Dialog.Footer>
                </Dialog>
            )}
            {dragPreview}
        </>
    );
};

export default GroupSection;
