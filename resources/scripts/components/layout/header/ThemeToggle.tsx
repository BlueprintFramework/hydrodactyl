import { Moon, Sun } from '@gravity-ui/icons';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppearance } from '@/contexts/AppearanceContext';

export default function ThemeToggle(): React.JSX.Element {
    const { theme, persistent, updateAppearance } = useAppearance();
    const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

    useEffect(() => {
        if (!persistent) {
            toast.error('Browser storage is unavailable. Your selection will last until you reload this page.', {
                id: 'appearance-storage-unavailable',
            });
        }
    }, [persistent]);

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
