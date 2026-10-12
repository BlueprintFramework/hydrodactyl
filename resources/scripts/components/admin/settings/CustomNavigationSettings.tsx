import { useState } from 'react';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { type CustomNavigationSettings as CustomNavValues, updateSettings } from '@/api/admin/settings';
import { useSettings } from '@/api/admin/useSettings';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const ICONS = ['link', 'book', 'globe', 'help', 'home', 'store', 'discord', 'document', 'terminal', 'rocket'] as const;

const CustomNavigationForm = ({ settings, onSaved }: { settings: CustomNavValues; onSaved: () => void }) => {
    const [items, setItems] = useState(settings.items);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const update = (index: number, patch: Partial<(typeof items)[number]>) =>
        setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

    const save = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateSettings('custom-navigation', { 'app:custom_nav_items': items });
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
            className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'
        >
            <div>
                <h2 className='text-sm font-semibold text-cream-50'>Custom Navigation Items</h2>
                <p className='mt-1 text-xs text-cream-400/50'>
                    Add up to 3 custom links to display at the bottom of the sidebar. Experimental.
                </p>
            </div>

            {items.map((item, index) => (
                <div key={index} className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <Field label={`Item ${index + 1} Label`} error={errors[`app:custom_nav_items.${index}.label`]}>
                        <Input.Text
                            maxLength={32}
                            placeholder='Documentation'
                            value={item.label}
                            onChange={(e) => update(index, { label: e.target.value })}
                        />
                    </Field>
                    <Field label={`Item ${index + 1} Link`} error={errors[`app:custom_nav_items.${index}.url`]}>
                        <Input.Text
                            maxLength={2048}
                            placeholder='https://example.com or /account'
                            value={item.url}
                            onChange={(e) => update(index, { url: e.target.value })}
                        />
                    </Field>
                    <Field label={`Item ${index + 1} Icon`} error={errors[`app:custom_nav_items.${index}.icon`]}>
                        <Dropdown
                            value={item.icon}
                            onChange={(value) => update(index, { icon: value })}
                            options={ICONS.map((icon) => ({
                                value: icon,
                                label: icon.charAt(0).toUpperCase() + icon.slice(1),
                            }))}
                        />
                    </Field>
                </div>
            ))}

            <div className='flex justify-end'>
                <Button type='submit' disabled={submitting}>
                    Save
                </Button>
            </div>
        </form>
    );
};

const CustomNavigationSettings = () => {
    const { data, mutate } = useSettings();

    if (!data) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return <CustomNavigationForm settings={data.custom_navigation} onSaved={mutate} />;
};

export default CustomNavigationSettings;
