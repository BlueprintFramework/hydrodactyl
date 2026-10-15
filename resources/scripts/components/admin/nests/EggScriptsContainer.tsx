import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { type EggScriptResponse, updateEggScripts } from '@/api/admin/nests';
import { useEggScripts } from '@/api/admin/useNests';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const cardClass = 'flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4';

const EggScriptsForm = ({
    eggId,
    data,
    onSaved,
}: {
    eggId: number | string;
    data: EggScriptResponse;
    onSaved: () => Promise<unknown>;
}) => {
    const [scriptInstall, setScriptInstall] = useState(data.data.script_install ?? '');
    const [copyScriptFrom, setCopyScriptFrom] = useState(
        data.data.copy_script_from === null ? '' : String(data.data.copy_script_from),
    );
    const [scriptContainer, setScriptContainer] = useState(data.data.script_container);
    const [scriptEntry, setScriptEntry] = useState(data.data.script_entry);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const copyOptions = [
        { value: '', label: 'None' },
        ...data.copy_from_options.map((option) => ({ value: String(option.id), label: option.name })),
    ];

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateEggScripts(eggId, {
                script_install: scriptInstall,
                script_is_privileged: true,
                script_entry: scriptEntry,
                script_container: scriptContainer,
                copy_script_from: copyScriptFrom,
            });
            await onSaved();
            toast.success('Install script updated.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to update the install script.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}
            className={cardClass}
        >
            <h2 className='text-sm font-semibold text-cream-50'>Install Script</h2>

            <Field
                label='Script'
                error={errors.script_install}
                hint='The install script that runs when a server using this egg is installed.'
            >
                <textarea
                    className='w-full rounded-lg bg-[#ffffff11] px-4 py-2 font-mono text-sm text-cream-100 outline-none'
                    rows={14}
                    value={scriptInstall}
                    onChange={(event) => setScriptInstall(event.target.value)}
                />
            </Field>

            {data.data.copy_from && (
                <div className='rounded-lg border border-brand-400/40 bg-brand-400/10 px-4 py-3 text-sm text-brand-400'>
                    This egg is copying installation scripts from <strong>{data.data.copy_from.name}</strong>. Changes
                    you make here will not apply unless you select None.
                </div>
            )}

            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <Field label='Copy Script From' error={errors.copy_script_from}>
                    <Dropdown value={copyScriptFrom} onChange={setCopyScriptFrom} options={copyOptions} />
                </Field>
                <Field label='Script Container' error={errors.script_container}>
                    <Input.Text value={scriptContainer} onChange={(event) => setScriptContainer(event.target.value)} />
                </Field>
                <Field label='Script Entrypoint Command' error={errors.script_entry}>
                    <Input.Text value={scriptEntry} onChange={(event) => setScriptEntry(event.target.value)} />
                </Field>
            </div>

            {data.rely_on_script.length > 0 && (
                <p className='text-xs text-cream-400/60'>
                    The following eggs rely on this script: {data.rely_on_script.map((egg) => egg.name).join(', ')}.
                </p>
            )}

            <div className='flex justify-end'>
                <Button type='submit' disabled={submitting}>
                    Save
                </Button>
            </div>
        </form>
    );
};

const EggScriptsContainer = () => {
    const { id } = useParams<'id'>();
    const { data, mutate } = useEggScripts(id);

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return <EggScriptsForm key={String(id)} eggId={id as string} data={data} onSaved={mutate} />;
};

export default EggScriptsContainer;
