import { type Actions, type State, useStoreActions, useStoreState } from 'easy-peasy';
import { useState } from 'react';
import { toast } from 'sonner';
import updateAccountName from '@/api/account/updateAccountName';
import { httpErrorToHuman } from '@/api/http';
import { Button } from '@/components/ui/button';
import type { ApplicationStore } from '@/state';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const UpdateDisplayNameForm = () => {
    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const updateUserData = useStoreActions((actions: Actions<ApplicationStore>) => actions.user.updateUserData);
    const displayName = [user?.nameFirst, user?.nameLast].filter(Boolean).join(' ');
    const [name, setName] = useState(displayName);
    const [saving, setSaving] = useState(false);

    const handleSubmit = () => {
        setSaving(true);
        updateAccountName(name)
            .then(() => {
                const parts = name.trim().split(/\s+/);
                const first = parts[0] || '';
                const last = parts.slice(1).join(' ');
                updateUserData({ nameFirst: first, nameLast: last });
                toast.success('Display name updated successfully');
            })
            .catch((e) => toast.error(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    return (
        <div className='space-y-4'>
            <p className='text-sm text-mocha-200'>
                Update your display name. This is how your name appears across the panel.
            </p>
            <div>
                <label htmlFor='displayname' className={labelClass}>
                    Displayname
                </label>
                <input
                    id='displayname'
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder='John Doe'
                />
            </div>
            <div className='flex justify-end'>
                <Button variant='default' onClick={handleSubmit} disabled={saving || !name.trim()}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
};

export default UpdateDisplayNameForm;
