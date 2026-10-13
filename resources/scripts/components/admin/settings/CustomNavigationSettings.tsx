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
import { useTranslation } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/types';

const ICONS = ['link', 'book', 'globe', 'help', 'home', 'store', 'discord', 'document', 'terminal', 'rocket'] as const;

const CustomNavigationForm = ({ settings, onSaved }: { settings: CustomNavValues; onSaved: () => void }) => {
    const { t } = useTranslation();
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
            className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'
        >
            <div>
                <h2 className='text-sm font-semibold text-cream-50'>{t('admin.settings.nav_items_title')}</h2>
                <p className='mt-1 text-xs text-cream-400/50'>{t('admin.settings.nav_items_description')}</p>
            </div>

            {items.map((item, index) => (
                <div key={index} className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <Field
                        label={t('admin.settings.item_label', { index: index + 1 })}
                        error={errors[`app:custom_nav_items.${index}.label`]}
                    >
                        <Input.Text
                            maxLength={32}
                            placeholder={t('admin.settings.item_label_placeholder')}
                            value={item.label}
                            onChange={(e) => update(index, { label: e.target.value })}
                        />
                    </Field>
                    <Field
                        label={t('admin.settings.item_link', { index: index + 1 })}
                        error={errors[`app:custom_nav_items.${index}.url`]}
                    >
                        <Input.Text
                            maxLength={2048}
                            placeholder={t('admin.settings.item_link_placeholder')}
                            value={item.url}
                            onChange={(e) => update(index, { url: e.target.value })}
                        />
                    </Field>
                    <Field
                        label={t('admin.settings.item_icon', { index: index + 1 })}
                        error={errors[`app:custom_nav_items.${index}.icon`]}
                    >
                        <Dropdown
                            value={item.icon}
                            onChange={(value) => update(index, { icon: value })}
                            options={ICONS.map((icon) => ({
                                value: icon,
                                label: t(`admin.settings.nav_icons.${icon}` as TranslationKey),
                            }))}
                        />
                    </Field>
                </div>
            ))}

            <div className='flex justify-end'>
                <Button type='submit' disabled={submitting}>
                    {t('common.save')}
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
