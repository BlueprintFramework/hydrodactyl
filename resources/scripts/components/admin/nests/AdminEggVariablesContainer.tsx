import { useState } from 'react';
import useSWR from 'swr';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import {
    getEggVariables,
    createEggVariable,
    updateEggVariable,
    deleteEggVariable,
    type AdminEggVariable,
} from '@/api/admin/nests';
import { httpErrorToHuman } from '@/api/http';

interface Props {
    nestId: number;
    eggId: number;
}

interface VarForm {
    name: string;
    description: string;
    env_variable: string;
    default_value: string;
    user_viewable: boolean;
    user_editable: boolean;
    rules: string;
}

const emptyForm = (): VarForm => ({
    name: '',
    description: '',
    env_variable: '',
    default_value: '',
    user_viewable: true,
    user_editable: true,
    rules: '',
});

const AdminEggVariablesContainer = ({ nestId, eggId }: Props) => {
    const { data: variables, error, mutate } = useSWR(
        ['admin:egg:variables', nestId, eggId],
        () => getEggVariables(nestId, eggId),
    );

    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState<VarForm>(emptyForm());
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const resetForm = () => {
        setForm(emptyForm());
        setEditingId(null);
        setShowCreate(false);
        setSaveError(null);
    };

    const handleSave = () => {
        setSaveError(null);
        setSuccess(false);
        setSaving(true);

        const data: VarForm = { ...form };

        const apiCall = editingId
            ? updateEggVariable(nestId, eggId, editingId, data)
            : createEggVariable(nestId, eggId, data);

        apiCall
            .then(() => {
                setSuccess(true);
                resetForm();
                mutate();
                setTimeout(() => setSuccess(false), 3000);
            })
            .catch((e) => setSaveError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleEdit = (v: AdminEggVariable) => {
        setForm({
            name: v.name,
            description: v.description,
            env_variable: v.envVariable,
            default_value: v.defaultValue,
            user_viewable: v.userViewable,
            user_editable: v.userEditable,
            rules: v.rules,
        });
        setEditingId(v.id);
        setShowCreate(true);
        setSaveError(null);
    };

    const handleDelete = (v: AdminEggVariable) => {
        if (!confirm(`Delete variable "${v.name}"?`)) return;
        deleteEggVariable(nestId, eggId, v.id)
            .then(() => mutate())
            .catch((e) => setSaveError(httpErrorToHuman(e)));
    };

    const set = (key: keyof VarForm, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    if (error) return <div className='text-red-400 text-sm p-4'>{httpErrorToHuman(error)}</div>;
    if (!variables) return <Spinner />;

    return (
        <div className='mt-4'>
            {saveError && <div className='text-red-400 mb-4 text-sm'>{saveError}</div>}
            {success && <div className='text-green-400 mb-4 text-sm'>Variable saved.</div>}

            {showCreate && (
                <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-6 mb-6'>
                    <h4 className='text-cream-400 font-medium mb-4'>{editingId ? 'Edit' : 'Create'} Variable</h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm text-mocha-200 mb-1'>Name</label>
                            <input value={form.name} onChange={(e) => set('name', e.target.value)}
                                className='w-full bg-transparent border border-mocha-400 rounded px-3 py-2 text-cream-400 text-sm' />
                        </div>
                        <div>
                            <label className='block text-sm text-mocha-200 mb-1'>Environment Variable</label>
                            <input value={form.env_variable} onChange={(e) => set('env_variable', e.target.value)}
                                className='w-full bg-transparent border border-mocha-400 rounded px-3 py-2 text-cream-400 text-sm font-mono' />
                        </div>
                        <div className='md:col-span-2'>
                            <label className='block text-sm text-mocha-200 mb-1'>Description</label>
                            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                                className='w-full bg-transparent border border-mocha-400 rounded px-3 py-2 text-cream-400 text-sm' rows={2} />
                        </div>
                        <div>
                            <label className='block text-sm text-mocha-200 mb-1'>Default Value</label>
                            <input value={form.default_value} onChange={(e) => set('default_value', e.target.value)}
                                className='w-full bg-transparent border border-mocha-400 rounded px-3 py-2 text-cream-400 text-sm' />
                        </div>
                        <div>
                            <label className='block text-sm text-mocha-200 mb-1'>Validation Rules</label>
                            <input value={form.rules} onChange={(e) => set('rules', e.target.value)}
                                className='w-full bg-transparent border border-mocha-400 rounded px-3 py-2 text-cream-400 text-sm font-mono' />
                        </div>
                        <div className='flex items-center gap-6'>
                            <label className='flex items-center gap-2 text-sm text-mocha-200'>
                                <input type='checkbox' checked={form.user_viewable}
                                    onChange={(e) => set('user_viewable', e.target.checked)}
                                    className='rounded border-mocha-400 bg-transparent' />
                                User Viewable
                            </label>
                            <label className='flex items-center gap-2 text-sm text-mocha-200'>
                                <input type='checkbox' checked={form.user_editable}
                                    onChange={(e) => set('user_editable', e.target.checked)}
                                    className='rounded border-mocha-400 bg-transparent' />
                                User Editable
                            </label>
                        </div>
                    </div>
                    <div className='flex gap-2 mt-4'>
                        <Button variant='default' onClick={handleSave} disabled={saving || !form.name}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button variant='secondary' onClick={resetForm}>Cancel</Button>
                    </div>
                </div>
            )}

            <div className='flex items-center justify-between mb-4'>
                <h4 className='text-cream-400 font-medium'>Variables ({variables.length})</h4>
                {!showCreate && <Button variant='default' onClick={() => setShowCreate(true)}>Create Variable</Button>}
            </div>

            {variables.length === 0 ? (
                <p className='text-mocha-200 text-sm'>No variables defined for this egg.</p>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {variables.map((v) => (
                        <div key={v.id} className='bg-mocha-500 border border-mocha-400 rounded-lg p-4'>
                            <div className='flex items-start justify-between mb-2'>
                                <div>
                                    <span className='text-cream-400 font-medium text-sm'>{v.name}</span>
                                    <span className='text-mocha-200 text-xs ml-2 font-mono'>{v.envVariable}</span>
                                </div>
                                <div className='flex gap-2'>
                                    <Button variant='ghost' size='sm' onClick={() => handleEdit(v)}>Edit</Button>
                                    <Button variant='attention' size='sm' onClick={() => handleDelete(v)}>Delete</Button>
                                </div>
                            </div>
                            {v.description && <p className='text-mocha-200 text-xs mb-2'>{v.description}</p>}
                            <div className='flex flex-wrap gap-2 text-xs'>
                                <span className='text-mocha-200/60'>Default: <span className='text-mocha-200 font-mono'>{v.defaultValue || '-'}</span></span>
                                {v.rules && <span className='text-mocha-200/60'>Rules: <span className='text-mocha-200 font-mono'>{v.rules}</span></span>}
                                <span className={v.userViewable ? 'text-green-500' : 'text-mocha-200/60'}>{v.userViewable ? 'Viewable' : 'Hidden'}</span>
                                <span className={v.userEditable ? 'text-green-500' : 'text-mocha-200/60'}>{v.userEditable ? 'Editable' : 'Read-only'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminEggVariablesContainer;
