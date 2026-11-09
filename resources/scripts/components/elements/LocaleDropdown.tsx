import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Flag from '@/components/ui/Flag';
import { useTranslation } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

interface LocaleDropdownProps {
    className?: string;
}

/**
 * Presentational language picker backed by the discovered locales. Anything
 * dropped into `resources/lang/<code>/` shows up here without further wiring.
 */
const LocaleDropdown = ({ className }: LocaleDropdownProps) => {
    const { t, locale, locales, setLocale } = useTranslation();
    const current = locales.find((definition) => definition.code === locale);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type='button'
                    size={'sm'}
                    variant={'secondary'}
                    aria-label={t('panel.language')}
                    className={cn('h-8 gap-2 rounded-full px-3', className)}
                >
                    <Flag identifier={current?.shortIdentifier ?? current?.code ?? locale} />
                    <span>{current?.label ?? locale}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='z-99999 max-h-80 overflow-y-auto' sideOffset={8}>
                {locales.map((definition) => (
                    <DropdownMenuItem
                        key={definition.code}
                        onSelect={() => setLocale(definition.code)}
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

export default LocaleDropdown;
