import { useCallback, useState } from 'react';
import { createServerGroup } from '@/api/serverGroups';
import { Dialog } from '@/components/elements/dialog';
import Input, { Textarea } from '@/components/elements/Input';
import Label from '@/components/elements/Label';

interface CreateGroupModalProps {
    onClose: () => void;
    onCreated: () => void;
}

const CreateGroupModal = ({ onClose, onCreated }: CreateGroupModalProps) => {
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
            const message = err instanceof Error ? err.message : 'Failed to create group';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [name, description, onCreated]);

    return (
        <Dialog.Confirm
            open
            onClose={onClose}
            title='Create Server Group'
            confirm='Create Group'
            onConfirmed={handleSubmit}
            confirmDisabled={!name.trim() || loading}
        >
            <div className='space-y-4'>
                <div>
                    <Label className='text-sm text-[#ffffff77]'>Group Name</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder='e.g. Minecraft Servers'
                        autoFocus
                        className='w-full'
                    />
                </div>
                <div>
                    <Label className='text-sm text-[#ffffff77]'>Description</Label>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder='Optional description for this group'
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
