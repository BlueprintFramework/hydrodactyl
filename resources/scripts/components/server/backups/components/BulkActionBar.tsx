import Can from '@/components/elements/Can';
import { Checkbox } from '@/components/elements/CheckboxNew';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { UnifiedBackup } from '../types';

interface BulkActionBarProps {
    selectableBackups: UnifiedBackup[];
    selectedBackups: Set<string>;
    onSelectAll: () => void;
    onDownloadSelected: () => void;
    onDeleteSelected: () => void;
}

const BulkActionBar = ({
    selectableBackups,
    selectedBackups,
    onSelectAll,
    onDownloadSelected,
    onDeleteSelected,
}: BulkActionBarProps) => {
    const { t } = useTranslation();

    if (selectableBackups.length === 0) return null;
    if (selectedBackups.size === 0) return null;

    const allSelected = selectedBackups.size === selectableBackups.length && selectableBackups.length > 0;

    return (
        <div className='ml-auto flex shrink-0 items-center gap-3'>
            <div className='flex items-center gap-3'>
                <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
                <span className='text-sm text-zinc-300'>
                    <span className='font-medium'>{selectedBackups.size}</span> {t('server.backups.selected')}
                </span>
            </div>

            <div className='flex items-center gap-2'>
                <Can action='backup.download'>
                    <Button variant='secondary' onClick={onDownloadSelected}>
                        {t('server.backups.download_selected', { count: selectedBackups.size })}
                    </Button>
                </Can>
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
