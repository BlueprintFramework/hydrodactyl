import { Navigate } from 'react-router-dom';

import SetupContainer from '@/components/setup/SetupContainer';
import Logo from '@/components/elements/HydroLogo';

// `window.SetupRequired` is injected by the backend (templates/wrapper.blade.php)
// only when the panel is unauthenticated and has zero users. Once any user
// exists the flag is absent and `/setup` bounces back to the app root.
const setupRequired = () => !!(window as { SetupRequired?: boolean }).SetupRequired;

const SetupRouter = () => {
    if (!setupRequired()) {
        return <Navigate to='/' replace />;
    }

    return (
        <div className='absolute w-full h-full flex justify-center items-center rounded-md [--page-padding:--spacing(8)]'>
            {/* Noise texture — shared with the auth surface for continuity. */}
            <div
                style={{
                    backgroundImage: 'url(/assets/auth-noise.png)',
                    backgroundSize: '1920px 1080px',
                    backgroundRepeat: 'repeat',
                    backgroundPosition: '0 0',
                }}
                className='pointer-events-none fixed inset-0 z-1 opacity-[0.4]'
            />
            <div className='flex size-full'>
                <div className='w-full max-w-4xl z-2 flex items-start sm:items-center bg-bg-lowered px-5 py-8 sm:px-[calc(var(--page-padding)*3)] sm:py-[calc(var(--page-padding)*2)] overflow-y-auto'>
                    <SetupContainer />
                </div>

                {/* Brand panel */}
                <div className='w-full relative hidden md:block'>
                    <div className='flex items-center gap-3 h-6 absolute right-(--page-padding) top-(--page-padding) text-lg text-cream-300'>
                        <Logo className='h-full w-auto' />
                        <div className='border-l border-cream-300/20 h-full' />
                        <span className='text-sm tracking-wide'>Hydrodactyl</span>
                    </div>

                    <div className='absolute inset-0 flex flex-col justify-end p-(--page-padding) gap-3'>
                        <h1 className='text-4xl font-semibold text-cream-200 text-wrap-pretty max-w-sm leading-tight'>
                            Set up your panel.
                        </h1>
                        <p className='text-sm text-secondary max-w-sm leading-relaxed'>
                            A fresh install has no administrator yet — let&apos;s create your first
                            account and get you signed in.
                        </p>
                    </div>

                    {/* Gradients — same family as the auth surface. */}
                    <div className='opacity-50'>
                        <div className='absolute inset-0 bg-gradient-to-tr from-transparent via-brand-400/5 to-brand-600/10' />
                        <div className='absolute inset-0 bg-gradient-to-tr to-transparent via-brand-400/5 from-brand-600/10' />
                        <div className='absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-500/13 to-transparent' />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetupRouter;
