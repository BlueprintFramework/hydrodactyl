import { forwardRef, useEffect } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';

export interface PageContentBlockProps {
    title: string;
    className?: string;
    showFlashKey?: string;
    background?: boolean;
    children?: React.ReactNode;
}

const PageContentBlock = forwardRef<HTMLDivElement, PageContentBlockProps>(
    ({ title, showFlashKey, className, children, background = true }, ref) => {
        useEffect(() => {
            if (title) {
                const configuredName = (window as { SiteConfiguration?: { name?: unknown } }).SiteConfiguration?.name;
                const siteName =
                    typeof configuredName === 'string' && configuredName.trim().length > 0
                        ? configuredName
                        : 'Hydrodactyl';

                document.title = `${title} | ${siteName}`;
            }
        }, [title]);

        return (
            <div
                ref={ref}
                className={`${className || ''} max-w-[120rem] overflow-y-auto overscroll-y-contain w-full mx-auto flex flex-col flex-1 h-full relative rounded-2xl ${background ? 'bg-bg-raised border border-mocha-400 p-7' : ''}`}
            >
                {showFlashKey && <FlashMessageRender byKey={showFlashKey} />}
                {children}
            </div>
        );
    },
);

PageContentBlock.displayName = 'PageContentBlock';

export default PageContentBlock;
