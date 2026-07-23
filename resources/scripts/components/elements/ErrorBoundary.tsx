import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Component, type ReactNode } from 'react';
import { toast } from 'sonner';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
    override state: State = {
        hasError: false,
    };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(error, errorInfo);
        this.setState({ errorInfo });
    }

    handleCopy = () => {
        const { error, errorInfo } = this.state;
        const text = [
            `Error: ${error?.message ?? 'Unknown'}`,
            error?.stack && `\nStack:\n${error.stack}`,
            errorInfo?.componentStack && `\nComponent Stack:\n${errorInfo.componentStack}`,
        ]
            .filter(Boolean)
            .join('\n');

        navigator.clipboard.writeText(text).then(() => {
            toast.success('Error details copied to clipboard');
        });
    };

    handleRefresh = () => {
        window.location.reload();
    };

    override render() {
        if (this.state.hasError) {
            return (
                <div className='flex items-center justify-center w-full my-6 px-4'>
                    <div className='w-full max-w-lg bg-mocha-500 border border-red-400/30 rounded-xl p-6'>
                        <div className='flex items-start gap-4'>
                            <div className='w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0'>
                                <HugeiconsIcon icon={InformationCircleIcon} className='w-5 h-5 text-red-400' />
                            </div>
                            <div className='flex-1 min-w-0'>
                                <h3 className='text-sm font-semibold text-cream-400 mb-1'>Something went wrong</h3>
                                <p className='text-xs text-mocha-200/70 leading-relaxed'>
                                    An error was encountered while rendering this view. Try refreshing the page.
                                </p>
                            </div>
                        </div>
                        <div className='flex items-center gap-2 mt-4 pt-4 border-t border-mocha-400'>
                            <button
                                type='button'
                                onClick={this.handleRefresh}
                                className='px-3 py-1.5 rounded-lg bg-mocha-400 text-cream-400 text-xs font-medium hover:bg-mocha-300 transition-colors'
                            >
                                Refresh Page
                            </button>
                            <button
                                type='button'
                                onClick={this.handleCopy}
                                className='px-3 py-1.5 rounded-lg bg-mocha-600 text-mocha-200 text-xs font-medium hover:bg-mocha-500 transition-colors border border-mocha-400'
                            >
                                Copy Error Details
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
