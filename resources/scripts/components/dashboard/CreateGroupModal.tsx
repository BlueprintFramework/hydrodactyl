import { useCallback, useState } from 'react';
import { createServerGroup } from '@/api/serverGroups';
import { Dialog } from '@/components/elements/dialog';
import Input, { Textarea } from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import { useTranslation } from '@/i18n/I18nProvider';

interface CreateGroupModalProps {
    onClose: () => void;
    onCreated: () => void;
}

const CreateGroupModal = ({ onClose, onCreated }: CreateGroupModalProps) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!name.trim()) return;

        setLoading(true);
        setError(null);

        try {
            await createServerGroup(name.trim(), undefined, description.trim() || undefined);
            onCreated();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('dashboard.groups.create_failed');
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [name, description, onCreated, t]);

    return (
        <Dialog.Confirm
            open
            onClose={onClose}
            title={t('dashboard.groups.create_title')}
            confirm={t('dashboard.groups.create')}
            onConfirmed={handleSubmit}
            confirmDisabled={!name.trim() || loading}
        >
            <div className='space-y-4'>
                <div>
                    <Label className='text-sm text-[#ffffff77]'>{t('dashboard.groups.name_label')}</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('dashboard.groups.name_placeholder')}
                        autoFocus
                        className='w-full'
                    />
                </div>
                <div>
                    <Label className='text-sm text-[#ffffff77]'>{t('dashboard.groups.description_label')}</Label>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('dashboard.groups.description_placeholder')}
                        rows={3}
                        className='w-full'
                    />
                </div>
                {error && <p className='text-sm text-red-400'>{error}</p>}
            </div>
        </Dialog.Confirm>
    );
};

export default CreateGroupModal;
