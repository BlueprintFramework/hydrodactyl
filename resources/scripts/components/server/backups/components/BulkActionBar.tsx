import Can from '@/components/elements/Can';
import { Checkbox } from '@/components/elements/CheckboxNew';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { UnifiedBackup } from '../types';

interface BulkActionBarProps {
    selectableBackups: UnifiedBackup[];
    selectedBackups: Set<string>;
    onSelectAll: () => void;
    onClear: () => void;
    onDeleteSelected: () => void;
}

const BulkActionBar = ({
    selectableBackups,
    selectedBackups,
    onSelectAll,
    onClear,
    onDeleteSelected,
}: BulkActionBarProps) => {
    const { t } = useTranslation();

    if (selectableBackups.length === 0) return null;

    const allSelected = selectedBackups.size === selectableBackups.length && selectableBackups.length > 0;

    return (
        <div className='mb-8 flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#ffffff08] border border-zinc-700'>
            <div className='flex items-center gap-4'>
                <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
                <span className='text-sm text-zinc-300'>
                    {selectedBackups.size > 0 ? (
                        <>
                            <span className='font-medium'>{selectedBackups.size}</span> {t('server.backups.selected')}
                        </>
                    ) : (
                        t('server.backups.select_backups')
                    )}
                </span>
            </div>

            <div
                className={`flex items-center gap-3 transition-opacity ${selectedBackups.size > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <Button variant='secondary' onClick={onClear}>
                    {t('common.clear')}
                </Button>
                <Can action='backup.delete'>
                    <Button variant='destructive' onClick={onDeleteSelected}>
                        {t('server.backups.delete_selected', { count: selectedBackups.size })}
                    </Button>
                </Can>
            </div>
        </div>
    );
};

export default BulkActionBar;
