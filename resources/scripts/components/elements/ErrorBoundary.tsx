import { Component, type ReactNode } from 'react';

import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

const ErrorFallback = () => {
    const { t } = useTranslation();

    return (
        <div className='w-full h-full flex gap-12 items-center p-8 max-w-3xl mx-auto'>
            <div className='flex flex-col gap-8 max-w-sm text-left'>
                <h1 className='text-[32px] font-extrabold leading-[98%] tracking-[-0.11rem]'>
                    {t('errors.boundary.title')}
                </h1>
                <p className=''>{t('errors.boundary.description')}</p>
                <div className='flex flex-col gap-2'>
                    <a href='/' className='text-brand hover:underline'>
                        {t('errors.boundary.your_servers')}
                    </a>
                    <button
                        type='button'
                        onClick={() => window.location.reload()}
                        className='text-brand hover:underline text-left'
                    >
                        {t('errors.boundary.refresh')}
                    </button>
                </div>
            </div>
            <img
                alt=''
                className='w-64 rounded-2xl'
                height='256'
                src='https://media.tenor.com/scX-kVPwUn8AAAAC/this-is-fine.gif'
                width='256'
                loading='lazy'
                decoding='async'
            />
        </div>
    );
};

class ErrorBoundary extends Component<Props, State> {
    override state: State = {
        hasError: false,
    };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    override componentDidCatch(error: Error) {
        console.error(error);
    }

    override render() {
        if (this.state.hasError) {
            return <ErrorFallback />;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
