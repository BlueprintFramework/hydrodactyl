import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link } from 'react-router-dom';

const ScreenBlock = ({ title, message }: { title: string; message: string }) => {
    return (
        <div className='w-full h-full flex items-center justify-center p-8 max-w-3xl mx-auto'>
            <div className='w-full max-w-lg bg-mocha-500 border border-mocha-400 rounded-xl p-8'>
                <div className='flex items-start gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 border border-mocha-400'>
                        <HugeiconsIcon icon={InformationCircleIcon} className='w-6 h-6 text-brand' />
                    </div>
                    <div className='flex-1'>
                        <h1 className='text-xl font-bold text-cream-400 mb-2'>{title}</h1>
                        <p className='text-sm text-mocha-200 leading-relaxed'>{message}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ServerError = ({ title, message }: { title: string; message: string }) => {
    return (
        <div className='w-full h-full flex items-center justify-center p-8 max-w-3xl mx-auto'>
            <div className='w-full max-w-lg bg-mocha-500 border border-red-400/30 rounded-xl p-8'>
                <div className='flex items-start gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0'>
                        <HugeiconsIcon icon={InformationCircleIcon} className='w-6 h-6 text-red-400' />
                    </div>
                    <div className='flex-1'>
                        <h1 className='text-xl font-bold text-cream-400 mb-2'>{title}</h1>
                        <p className='text-sm text-mocha-200 leading-relaxed'>{message}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NotFound = () => {
    return (
        <div className='w-full h-full flex items-center justify-center p-8 max-w-3xl mx-auto'>
            <div className='w-full max-w-lg bg-mocha-500 border border-mocha-400 rounded-xl p-8'>
                <div className='flex items-start gap-4'>
                    <div className='w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0'>
                        <HugeiconsIcon icon={InformationCircleIcon} className='w-6 h-6 text-amber-400' />
                    </div>
                    <div className='flex-1'>
                        <h1 className='text-xl font-bold text-cream-400 mb-2'>Page Not Found</h1>
                        <p className='text-sm text-mocha-200 leading-relaxed mb-4'>
                            We couldn&apos;t find the page you&apos;re looking for. You may have lost access, or the
                            page may have been removed.
                        </p>
                        <Link
                            to='/'
                            className='inline-flex items-center px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand/80 transition-colors'
                        >
                            Back to Servers
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { NotFound, ServerError };
export default ScreenBlock;
