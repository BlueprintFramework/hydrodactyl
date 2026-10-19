import { Moon, Sun } from '@gravity-ui/icons';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useTranslation } from '@/i18n/I18nProvider';

export default function ThemeToggle(): React.JSX.Element {
    const { t } = useTranslation();
    const { theme, persistent, updateAppearance } = useAppearance();
    const label = t(theme === 'dark' ? 'appearance.switch_light' : 'appearance.switch_dark');

    useEffect(() => {
        if (!persistent) {
            toast.error(t('appearance.storage_unavailable'), {
                id: 'appearance-storage-unavailable',
            });
        }
    }, [persistent, t]);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type='button'
                        variant='ghost'
                        size='md'
                        shape='round'
                        className='p-0 shrink-0 focus-visible:ring-mocha-50'
                        aria-label={label}
                        data-icon={theme === 'dark' ? 'sun' : 'moon'}
                        onClick={() => updateAppearance({ mode: theme === 'dark' ? 'light' : 'dark' })}
                    >
                        {theme === 'dark' ? <Sun width={20} height={20} /> : <Moon width={20} height={20} />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
