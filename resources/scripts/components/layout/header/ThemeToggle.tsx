import { Moon, Sun } from '@gravity-ui/icons';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useTranslation } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

export default function ThemeToggle(): React.JSX.Element {
    const { t } = useTranslation();
    const { theme, persistent, updateAppearance } = useAppearance();
    const isDark = theme === 'dark';
    const label = t(isDark ? 'appearance.switch_light' : 'appearance.switch_dark');

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
                    <button
                        type='button'
                        className='group relative h-11 w-13 shrink-0 cursor-pointer rounded-full select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mocha-50'
                        aria-label={label}
                        data-icon={isDark ? 'sun' : 'moon'}
                        onClick={() => updateAppearance({ mode: isDark ? 'light' : 'dark' })}
                    >
                        <span
                            aria-hidden='true'
                            className='absolute inset-x-0 top-1/2 flex h-8 -translate-y-1/2 items-center justify-between gap-2 rounded-full bg-mocha-400 px-2 shadow-sm transition-colors duration-200 group-hover:bg-mocha-300 group-active:bg-mocha-300/80 motion-reduce:transition-none'
                        >
                            <span
                                className={cn(
                                    'absolute top-1.5 left-1 size-5 rounded-full bg-cream-400 shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none',
                                    isDark && 'translate-x-6',
                                )}
                            />
                            <Sun
                                width={14}
                                height={14}
                                className={cn(
                                    'relative z-10 transition-colors duration-200 motion-reduce:transition-none',
                                    isDark ? 'text-cream-400/50' : 'text-mocha-500',
                                )}
                            />
                            <Moon
                                width={14}
                                height={14}
                                className={cn(
                                    'relative z-10 transition-colors duration-200 motion-reduce:transition-none',
                                    isDark ? 'text-mocha-500' : 'text-cream-400/50',
                                )}
                            />
                        </span>
                    </button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
