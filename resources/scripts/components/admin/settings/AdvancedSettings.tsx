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
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
    requestTimeout: number;
    connectTimeout: number;
    allocationsEnabled: boolean;
    rangeStart: number | null;
    rangeEnd: number | null;
    groupsEnabled: boolean;
    perScheduleTaskLimit: number;
    stuckTimeout: number;
    resourceHistoryEnabled: boolean;
    resourceHistorySamples: number;
    onSaved: () => void;
}

const Toggle = ({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) => {
    const { t } = useTranslation();

    return (
        <Dropdown
            value={value ? 'true' : 'false'}
            onChange={(next) => onChange(next === 'true')}
            options={[
                { value: 'false', label: t('common.disabled') },
                { value: 'true', label: t('common.enabled') },
            ]}
        />
    );
};

const AdvancedForm = ({
    requestTimeout,
    connectTimeout,
    allocationsEnabled,
    rangeStart,
    rangeEnd,
    groupsEnabled,
    perScheduleTaskLimit,
    stuckTimeout,
    resourceHistoryEnabled,
    resourceHistorySamples,
    onSaved,
}: Props) => {
    const { t } = useTranslation();
    const [values, setValues] = useState({
        requestTimeout: String(requestTimeout),
        connectTimeout: String(connectTimeout),
        allocationsEnabled,
        rangeStart: rangeStart === null ? '' : String(rangeStart),
        rangeEnd: rangeEnd === null ? '' : String(rangeEnd),
        groupsEnabled,
        perScheduleTaskLimit: String(perScheduleTaskLimit),
        stuckTimeout: String(stuckTimeout),
        resourceHistoryEnabled,
        resourceHistorySamples: String(resourceHistorySamples),
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
                'pterodactyl:client_features:schedules:per_schedule_task_limit': values.perScheduleTaskLimit,
                'pterodactyl:client_features:schedules:stuck_timeout': values.stuckTimeout,
                'pterodactyl:client_features:resource_history:enabled': String(values.resourceHistoryEnabled),
                'pterodactyl:client_features:resource_history:samples': values.resourceHistorySamples,
            });
            await onSaved();
            toast.success(t('admin.settings.saved'));
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.settings.save_failed')));
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
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.settings.http_connections')}</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Field
                        label={t('admin.settings.connection_timeout')}
                        error={errors['pterodactyl:guzzle:connect_timeout']}
                        hint={t('admin.settings.connection_timeout_hint')}
                    >
                        <Input.Text
                            type='number'
                            value={values.connectTimeout}
                            onChange={(e) => setValues({ ...values, connectTimeout: e.target.value })}
                        />
                    </Field>
                    <Field
                        label={t('admin.settings.request_timeout')}
                        error={errors['pterodactyl:guzzle:timeout']}
                        hint={t('admin.settings.request_timeout_hint')}
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
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.settings.auto_allocations')}</h2>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <Field
                        label={t('admin.common.status')}
                        error={errors['pterodactyl:client_features:allocations:enabled']}
                    >
                        <Toggle
                            value={values.allocationsEnabled}
                            onChange={(value) => setValues({ ...values, allocationsEnabled: value })}
                        />
                    </Field>
                    <Field
                        label={t('admin.settings.starting_port')}
                        error={errors['pterodactyl:client_features:allocations:range_start']}
                    >
                        <Input.Text
                            type='number'
                            value={values.rangeStart}
                            onChange={(e) => setValues({ ...values, rangeStart: e.target.value })}
                            disabled={!values.allocationsEnabled}
                            className='disabled:cursor-not-allowed disabled:opacity-60'
                        />
                    </Field>
                    <Field
                        label={t('admin.settings.ending_port')}
                        error={errors['pterodactyl:client_features:allocations:range_end']}
                    >
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
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.settings.server_groups')}</h2>
                <Field
                    label={t('admin.common.status')}
                    error={errors['pterodactyl:client_features:groups:enabled']}
                    hint={t('admin.settings.server_groups_hint')}
                >
                    <Toggle
                        value={values.groupsEnabled}
                        onChange={(value) => setValues({ ...values, groupsEnabled: value })}
                    />
                </Field>
            </div>

            <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.settings.resource_history')}</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Field
                        label={t('admin.common.status')}
                        error={errors['pterodactyl:client_features:resource_history:enabled']}
                        hint={t('admin.settings.resource_history_hint')}
                    >
                        <Toggle
                            value={values.resourceHistoryEnabled}
                            onChange={(value) => setValues({ ...values, resourceHistoryEnabled: value })}
                        />
                    </Field>
                    <Field
                        label={t('admin.settings.samples_per_server')}
                        error={errors['pterodactyl:client_features:resource_history:samples']}
                        hint={t('admin.settings.samples_hint')}
                    >
                        <Input.Text
                            type='number'
                            min={20}
                            value={values.resourceHistorySamples}
                            onChange={(e) => setValues({ ...values, resourceHistorySamples: e.target.value })}
                        />
                    </Field>
                </div>
            </div>

            <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.settings.schedules_title')}</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Field
                        label={t('admin.settings.tasks_per_schedule')}
                        error={errors['pterodactyl:client_features:schedules:per_schedule_task_limit']}
                        hint={t('admin.settings.tasks_hint')}
                    >
                        <Input.Text
                            type='number'
                            min={1}
                            max={100}
                            value={values.perScheduleTaskLimit}
                            onChange={(e) => setValues({ ...values, perScheduleTaskLimit: e.target.value })}
                        />
                    </Field>
                    <Field
                        label={t('admin.settings.stuck_timeout')}
                        error={errors['pterodactyl:client_features:schedules:stuck_timeout']}
                        hint={t('admin.settings.stuck_hint')}
                    >
                        <Input.Text
                            type='number'
                            min={901}
                            max={86400}
                            value={values.stuckTimeout}
                            onChange={(e) => setValues({ ...values, stuckTimeout: e.target.value })}
                        />
                    </Field>
                </div>
            </div>

            <div className='flex justify-end'>
                <Button type='submit' disabled={submitting}>
                    {t('common.save')}
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
            perScheduleTaskLimit={data.advanced['pterodactyl:client_features:schedules:per_schedule_task_limit']}
            stuckTimeout={data.advanced['pterodactyl:client_features:schedules:stuck_timeout']}
            resourceHistoryEnabled={data.advanced['pterodactyl:client_features:resource_history:enabled']}
            resourceHistorySamples={data.advanced['pterodactyl:client_features:resource_history:samples']}
            onSaved={mutate}
        />
    );
};

export default AdvancedSettings;
