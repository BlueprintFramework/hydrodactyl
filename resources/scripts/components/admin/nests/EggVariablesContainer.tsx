import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import {
    createEggVariable,
    deleteEggVariable,
    type EggVariable,
    type EggVariableValues,
    updateEggVariable,
} from '@/api/admin/nests';
import { useEggVariables } from '@/api/admin/useNests';
import { Field } from '@/components/admin/Field';
import { Checkbox } from '@/components/elements/CheckboxNew';
import { Dialog } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const cardClass = 'flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4';

const defaultRules = 'required|string|max:20';

const variableOptions = (viewable: boolean, editable: boolean): string[] => {
    const options: string[] = [];

    if (viewable) {
        options.push('user_viewable');
    }

    if (editable) {
        options.push('user_editable');
    }

    return options;
};

const PermissionsField = ({
    viewable,
    editable,
    onViewableChange,
    onEditableChange,
}: {
    viewable: boolean;
    editable: boolean;
    onViewableChange: (value: boolean) => void;
    onEditableChange: (value: boolean) => void;
}) => (
    <Field label='Permissions'>
        <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-2'>
                <Checkbox checked={viewable} onCheckedChange={(checked) => onViewableChange(checked === true)} />
                <span className='text-sm text-cream-100'>Users Can View</span>
            </div>
            <div className='flex items-center gap-2'>
                <Checkbox checked={editable} onCheckedChange={(checked) => onEditableChange(checked === true)} />
                <span className='text-sm text-cream-100'>Users Can Edit</span>
            </div>
        </div>
    </Field>
);

const CreateVariableDialog = ({
    open,
    eggId,
    onClose,
    onCreated,
}: {
    open: boolean;
    eggId: number | string;
    onClose: () => void;
    onCreated: () => Promise<unknown>;
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [envVariable, setEnvVariable] = useState('');
    const [defaultValue, setDefaultValue] = useState('');
    const [viewable, setViewable] = useState(false);
    const [editable, setEditable] = useState(false);
    const [rules, setRules] = useState(defaultRules);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const close = () => {
        if (!submitting) {
            onClose();
        }
    };

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await createEggVariable(eggId, {
                name,
                description,
                env_variable: envVariable,
                default_value: defaultValue,
                options: variableOptions(viewable, editable),
                rules,
            });
            await onCreated();
            toast.success('Variable created.');
            setName('');
            setDescription('');
            setEnvVariable('');
            setDefaultValue('');
            setViewable(false);
            setEditable(false);
            setRules(defaultRules);
            onClose();
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to create the variable.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} title='Create Variable' onClose={close} preventExternalClose={submitting}>
            <div className='mt-4'>
                <form
                    id='create-variable-form'
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                    className='flex flex-col gap-4'
                >
                    <Field label='Name' error={errors.name} hint='A human readable name for this variable.'>
                        <Input.Text value={name} onChange={(event) => setName(event.target.value)} />
                    </Field>
                    <Field label='Description' error={errors.description} hint='Optional. Shown to the user.'>
                        <Input.Text value={description} onChange={(event) => setDescription(event.target.value)} />
                    </Field>
                    <Field
                        label='Environment Variable'
                        error={errors.env_variable}
                        hint='The variable name available to the startup command, e.g. SERVER_JARFILE.'
                    >
                        <Input.Text value={envVariable} onChange={(event) => setEnvVariable(event.target.value)} />
                    </Field>
                    <Field
                        label='Default Value'
                        error={errors.default_value}
                        hint='Used when the user does not set one.'
                    >
                        <Input.Text value={defaultValue} onChange={(event) => setDefaultValue(event.target.value)} />
                    </Field>
                    <PermissionsField
                        viewable={viewable}
                        editable={editable}
                        onViewableChange={setViewable}
                        onEditableChange={setEditable}
                    />
                    <Field
                        label='Input Rules'
                        error={errors.rules}
                        hint='Validation rules applied to the value, e.g. required|string|max:20.'
                    >
                        <Input.Text value={rules} onChange={(event) => setRules(event.target.value)} />
                    </Field>
                    <Dialog.Footer>
                        <Button type='button' variant='secondary' onClick={close} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type='submit' form='create-variable-form' disabled={submitting}>
                            Create
                        </Button>
                    </Dialog.Footer>
                </form>
            </div>
        </Dialog>
    );
};

const VariableCard = ({
    eggId,
    variable,
    onChanged,
}: {
    eggId: number | string;
    variable: EggVariable;
    onChanged: () => Promise<unknown>;
}) => {
    const [values, setValues] = useState<EggVariableValues>({
        name: variable.name,
        description: variable.description ?? '',
        env_variable: variable.env_variable,
        default_value: variable.default_value,
        options: variableOptions(variable.user_viewable, variable.user_editable),
        rules: variable.rules,
    });
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const set = <K extends keyof EggVariableValues>(key: K, value: EggVariableValues[K]) =>
        setValues((current) => ({ ...current, [key]: value }));

    const toggleOption = (option: string, checked: boolean) =>
        setValues((current) => ({
            ...current,
            options: checked
                ? [...current.options.filter((value) => value !== option), option]
                : current.options.filter((value) => value !== option),
        }));

    const save = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateEggVariable(eggId, variable.id, values);
            await onChanged();
            toast.success('Variable updated.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to update the variable.'));
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async () => {
        setDeleting(true);

        try {
            await deleteEggVariable(eggId, variable.id);
            await onChanged();
            toast.success('Variable deleted.');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete the variable.'));
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                void save();
            }}
            className={cardClass}
        >
            <h2 className='text-sm font-semibold text-cream-50'>
                {variable.required && (
                    <span className='mr-2 rounded-full bg-brand-400/20 px-2 py-0.5 text-[10px] uppercase text-brand-400'>
                        Required
                    </span>
                )}
                {values.name || variable.name}
            </h2>

            <Field label='Name' error={errors.name}>
                <Input.Text value={values.name} onChange={(event) => set('name', event.target.value)} />
            </Field>
            <Field label='Description' error={errors.description}>
                <Input.Text value={values.description} onChange={(event) => set('description', event.target.value)} />
            </Field>
            <Field label='Environment Variable' error={errors.env_variable}>
                <Input.Text value={values.env_variable} onChange={(event) => set('env_variable', event.target.value)} />
            </Field>
            <Field label='Default Value' error={errors.default_value}>
                <Input.Text
                    value={values.default_value}
                    onChange={(event) => set('default_value', event.target.value)}
                />
            </Field>
            <PermissionsField
                viewable={values.options.includes('user_viewable')}
                editable={values.options.includes('user_editable')}
                onViewableChange={(checked) => toggleOption('user_viewable', checked)}
                onEditableChange={(checked) => toggleOption('user_editable', checked)}
            />
            <Field label='Input Rules' error={errors.rules}>
                <Input.Text value={values.rules} onChange={(event) => set('rules', event.target.value)} />
            </Field>

            <div className='flex items-center justify-between'>
                <Button type='button' variant='attention' onClick={() => setConfirmDelete(true)}>
                    Delete
                </Button>
                <Button type='submit' disabled={submitting}>
                    Save
                </Button>
            </div>

            <Dialog.Confirm
                open={confirmDelete}
                title='Delete Variable'
                confirm='Delete'
                loading={deleting}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={remove}
            >
                Deleting this variable will remove it from every server using this egg. This cannot be undone.
            </Dialog.Confirm>
        </form>
    );
};

const EggVariablesContainer = () => {
    const { id } = useParams<'id'>();
    const { data, mutate } = useEggVariables(id);
    const [createOpen, setCreateOpen] = useState(false);

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const eggId = id as string;

    return (
        <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
                <h2 className='text-sm font-semibold text-cream-50'>Variables</h2>
                <Button onClick={() => setCreateOpen(true)}>Create New Variable</Button>
            </div>

            {data.data.length === 0 ? (
                <div className={cardClass}>
                    <p className='text-sm text-cream-400/50'>This egg has no variables.</p>
                </div>
            ) : (
                <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                    {data.data.map((variable) => (
                        <VariableCard key={variable.id} eggId={eggId} variable={variable} onChanged={mutate} />
                    ))}
                </div>
            )}

            <CreateVariableDialog
                open={createOpen}
                eggId={eggId}
                onClose={() => setCreateOpen(false)}
                onCreated={mutate}
            />
        </div>
    );
};

export default EggVariablesContainer;
