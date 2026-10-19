import { Toaster } from 'sonner';
import { useAppearance } from '@/contexts/AppearanceContext';

export default function AppearanceToaster() {
    const { theme } = useAppearance();
    return (
        <Toaster
            theme={theme}
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: 'p-4 bg-bg-raised text-primary border border-mocha-300 rounded-2xl shadow-lg flex items-center w-full gap-2',
                },
            }}
        />
    );
}
