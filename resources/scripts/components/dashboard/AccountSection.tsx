import FlashMessageRender from '@/components/FlashMessageRender';
import { cn } from '@/lib/utils';

interface Props {
    title: string;
    description?: string;
    descriptionId?: string;
    showFlashes?: string;
    className?: string;
    children: React.ReactNode;
}

const AccountSection = ({ title, description, descriptionId, showFlashes, className, children }: Props) => (
    <section
        className={cn('flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-5 sm:p-6', className)}
    >
        <div className='flex flex-col gap-1'>
            <h2 className='text-lg font-semibold tracking-tight'>{title}</h2>
            {description && (
                <p id={descriptionId} className='text-sm text-secondary'>
                    {description}
                </p>
            )}
        </div>
        {showFlashes && <FlashMessageRender byKey={showFlashes} />}
        {children}
    </section>
);

export default AccountSection;
