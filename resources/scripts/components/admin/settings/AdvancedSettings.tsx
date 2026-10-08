import { useState } from 'react';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { updateSettings } from '@/api/admin/settings';
import { useSettings } from '@/api/admin/useSettings';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

interface Props {
    requestTimeout: number;
    connectTimeout: number;
    allocationsEnabled: boolean;
    rangeStart: number | null;
    rangeEnd: number | null;
    groupsEnabled: boolean;
    onSaved: () => void;
}

const Toggle = ({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) => (
    <Dropdown
        value={value ? 'true' : 'false'}
        onChange={(next) => onChange(next === 'true')}
        options={[
            { value: 'false', label: 'Disabled' },
            { value: 'true', label: 'Enabled' },
        ]}
    />
);

const AdvancedForm = ({
    requestTimeout,
    connectTimeout,
    allocationsEnabled,
    rangeStart,
    rangeEnd,
    groupsEnabled,
    onSaved,
}: Props) => {
    const [values, setValues] = useState({
        requestTimeout: String(requestTimeout),
        connectTimeout: String(connectTimeout),
        allocationsEnabled,
        rangeStart: rangeStart === null ? '' : String(rangeStart),
        rangeEnd: rangeEnd === null ? '' : String(rangeEnd),
        groupsEnabled,
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const save = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateSettings('advanced', {
                'pterodactyl:guzzle:timeout': values.requestTimeout,
                'pterodactyl:guzzle:connect_timeout': values.connectTimeout,
                'pterodactyl:client_features:allocations:enabled': String(values.allocationsEnabled),
                'pterodactyl:client_features:allocations:range_start': values.rangeStart,
                'pterodactyl:client_features:allocations:range_end': values.rangeEnd,
                'pterodactyl:client_features:groups:enabled': String(values.groupsEnabled),
            });
            await onSaved();
            toast.success('Settings saved.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to save settings.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                void save();
            }}
            className='space-y-4'
        >
            <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                <h2 className='text-sm font-semibold text-cream-50'>HTTP Connections</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Field
                        label='Connection Timeout'
                        error={errors['pterodactyl:guzzle:connect_timeout']}
                        hint='Seconds to wait before timing out a connection attempt.'
                    >
                        <Input.Text
                            type='number'
                            value={values.connectTimeout}
                            onChange={(e) => setValues({ ...values, connectTimeout: e.target.value })}
                        />
                    </Field>
                    <Field
                        label='Request Timeout'
                        error={errors['pterodactyl:guzzle:timeout']}
                        hint='Seconds to wait before timing out an active request.'
                    >
                        <Input.Text
                            type='number'
                            value={values.requestTimeout}
                            onChange={(e) => setValues({ ...values, requestTimeout: e.target.value })}
                        />
                    </Field>
                </div>
            </div>

            <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                <h2 className='text-sm font-semibold text-cream-50'>Automatic Allocation Creation</h2>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <Field label='Status' error={errors['pterodactyl:client_features:allocations:enabled']}>
                        <Toggle
                            value={values.allocationsEnabled}
                            onChange={(value) => setValues({ ...values, allocationsEnabled: value })}
                        />
                    </Field>
                    <Field label='Starting Port' error={errors['pterodactyl:client_features:allocations:range_start']}>
                        <Input.Text
                            type='number'
                            value={values.rangeStart}
                            onChange={(e) => setValues({ ...values, rangeStart: e.target.value })}
                            disabled={!values.allocationsEnabled}
                            className='disabled:cursor-not-allowed disabled:opacity-60'
                        />
                    </Field>
                    <Field label='Ending Port' error={errors['pterodactyl:client_features:allocations:range_end']}>
                        <Input.Text
                            type='number'
                            value={values.rangeEnd}
                            onChange={(e) => setValues({ ...values, rangeEnd: e.target.value })}
                            disabled={!values.allocationsEnabled}
                            className='disabled:cursor-not-allowed disabled:opacity-60'
                        />
                    </Field>
                </div>
            </div>

            <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                <h2 className='text-sm font-semibold text-cream-50'>Server Groups</h2>
                <Field
                    label='Status'
                    error={errors['pterodactyl:client_features:groups:enabled']}
                    hint='Allow users to organize their servers on the dashboard.'
                >
                    <Toggle
                        value={values.groupsEnabled}
                        onChange={(value) => setValues({ ...values, groupsEnabled: value })}
                    />
                </Field>
            </div>

            <div className='flex justify-end'>
                <Button type='submit' disabled={submitting}>
                    Save
                </Button>
            </div>
        </form>
    );
};

const AdvancedSettings = () => {
    const { data, mutate } = useSettings();

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <AdvancedForm
            requestTimeout={data.advanced['pterodactyl:guzzle:timeout']}
            connectTimeout={data.advanced['pterodactyl:guzzle:connect_timeout']}
            allocationsEnabled={data.advanced['pterodactyl:client_features:allocations:enabled']}
            rangeStart={data.advanced['pterodactyl:client_features:allocations:range_start']}
            rangeEnd={data.advanced['pterodactyl:client_features:allocations:range_end']}
            groupsEnabled={data.advanced['pterodactyl:client_features:groups:enabled']}
            onSaved={mutate}
        />
    );
};

export default AdvancedSettings;
