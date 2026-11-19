import { type Actions, useStoreActions } from 'easy-peasy';
import { toast } from 'sonner';

import updateAccountLanguage from '@/api/account/updateAccountLanguage';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Flag from '@/components/ui/Flag';
import { useTranslation } from '@/i18n/I18nProvider';
import type { LocaleCode } from '@/i18n/types';
import { cn } from '@/lib/utils';
import type { ApplicationStore } from '@/state';

const LanguageSelector = () => {
    const { t, locale, locales, setLocale } = useTranslation();
    const updateUserData = useStoreActions((actions: Actions<ApplicationStore>) => actions.user.updateUserData);
    const current = locales.find((definition) => definition.code === locale);

    const onSelect = (code: LocaleCode) => {
        if (code === locale) {
            return;
        }

        const previous = locale;

        setLocale(code);
        updateUserData({ language: code });

        updateAccountLanguage(code).catch(() => {
            setLocale(previous);
            updateUserData({ language: previous });
            toast.error(t('account.language.update_failed'));
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size={'sm'}
                    variant={'secondary'}
                    aria-label={t('panel.language')}
                    className='h-11 sm:h-8 gap-2 rounded-full px-3'
                >
                    <Flag identifier={current?.shortIdentifier ?? current?.code ?? locale} />
                    <span className='text-right'>{current?.label ?? locale}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='z-99999' sideOffset={8} align='start'>
                {locales.map((definition) => (
                    <DropdownMenuItem
                        key={definition.code}
                        onSelect={() => onSelect(definition.code)}
                        className={cn('gap-2', definition.code === locale && 'bg-accent/20')}
                    >
                        <Flag identifier={definition.shortIdentifier ?? definition.code} />
                        <span>{definition.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default LanguageSelector;
