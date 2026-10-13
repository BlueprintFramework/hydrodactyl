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
import { useTranslation } from '@/i18n/I18nProvider';

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
}) => {
    const { t } = useTranslation();

    return (
        <Field label={t('admin.nests.permissions')}>
            <div className='flex flex-col gap-2'>
                <div className='flex items-center gap-2'>
                    <Checkbox checked={viewable} onCheckedChange={(checked) => onViewableChange(checked === true)} />
                    <span className='text-sm text-cream-100'>{t('admin.nests.users_can_view')}</span>
                </div>
                <div className='flex items-center gap-2'>
                    <Checkbox checked={editable} onCheckedChange={(checked) => onEditableChange(checked === true)} />
                    <span className='text-sm text-cream-100'>{t('admin.nests.users_can_edit')}</span>
                </div>
            </div>
        </Field>
    );
};

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
    const { t } = useTranslation();
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
            toast.success(t('admin.nests.variable_created'));
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
            toast.error(errorToMessage(error, t('admin.nests.variable_create_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} title={t('admin.nests.create_variable')} onClose={close} preventExternalClose={submitting}>
            <div className='mt-4'>
                <form
                    id='create-variable-form'
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                    className='flex flex-col gap-4'
                >
                    <Field label={t('admin.common.name')} error={errors.name} hint={t('admin.nests.var_name_hint')}>
                        <Input.Text value={name} onChange={(event) => setName(event.target.value)} />
                    </Field>
                    <Field
                        label={t('admin.common.description')}
                        error={errors.description}
                        hint={t('admin.nests.var_description_hint')}
                    >
                        <Input.Text value={description} onChange={(event) => setDescription(event.target.value)} />
                    </Field>
                    <Field
                        label={t('admin.nests.env_variable')}
                        error={errors.env_variable}
                        hint={t('admin.nests.env_variable_hint')}
                    >
                        <Input.Text value={envVariable} onChange={(event) => setEnvVariable(event.target.value)} />
                    </Field>
                    <Field
                        label={t('admin.nests.default_value')}
                        error={errors.default_value}
                        hint={t('admin.nests.default_value_hint')}
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
                        label={t('admin.nests.input_rules_field')}
                        error={errors.rules}
                        hint={t('admin.nests.input_rules_hint')}
                    >
                        <Input.Text value={rules} onChange={(event) => setRules(event.target.value)} />
                    </Field>
                    <Dialog.Footer>
                        <Button type='button' variant='secondary' onClick={close} disabled={submitting}>
                            {t('common.cancel')}
                        </Button>
                        <Button type='submit' form='create-variable-form' disabled={submitting}>
                            {t('common.create')}
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
    const { t } = useTranslation();
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
            toast.success(t('admin.nests.variable_updated'));
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.nests.variable_update_failed')));
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async () => {
        setDeleting(true);

        try {
            await deleteEggVariable(eggId, variable.id);
            await onChanged();
            toast.success(t('admin.nests.variable_deleted'));
        } catch (error) {
            toast.error(errorToMessage(error, t('admin.nests.variable_delete_failed')));
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
                        {t('admin.nests.required_badge')}
                    </span>
                )}
                {values.name || variable.name}
            </h2>

            <Field label={t('admin.common.name')} error={errors.name}>
                <Input.Text value={values.name} onChange={(event) => set('name', event.target.value)} />
            </Field>
            <Field label={t('admin.common.description')} error={errors.description}>
                <Input.Text value={values.description} onChange={(event) => set('description', event.target.value)} />
            </Field>
            <Field label={t('admin.nests.env_variable')} error={errors.env_variable}>
                <Input.Text value={values.env_variable} onChange={(event) => set('env_variable', event.target.value)} />
            </Field>
            <Field label={t('admin.nests.default_value')} error={errors.default_value}>
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
            <Field label={t('admin.nests.input_rules_field')} error={errors.rules}>
                <Input.Text value={values.rules} onChange={(event) => set('rules', event.target.value)} />
            </Field>

            <div className='flex items-center justify-between'>
                <Button type='button' variant='attention' onClick={() => setConfirmDelete(true)}>
                    {t('common.delete')}
                </Button>
                <Button type='submit' disabled={submitting}>
                    {t('common.save')}
                </Button>
            </div>

            <Dialog.Confirm
                open={confirmDelete}
                title={t('admin.nests.delete_variable')}
                confirm={t('common.delete')}
                loading={deleting}
                onClose={() => setConfirmDelete(false)}
                onConfirmed={remove}
            >
                {t('admin.nests.delete_variable_confirm')}
            </Dialog.Confirm>
        </form>
    );
};

const EggVariablesContainer = () => {
    const { t } = useTranslation();
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
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.nests.variables_title')}</h2>
                <Button onClick={() => setCreateOpen(true)}>{t('admin.nests.create_new_variable')}</Button>
            </div>

            {data.data.length === 0 ? (
                <div className={cardClass}>
                    <p className='text-sm text-cream-400/50'>{t('admin.nests.no_variables')}</p>
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
