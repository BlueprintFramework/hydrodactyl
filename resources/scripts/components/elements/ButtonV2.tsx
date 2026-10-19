import clsx from 'clsx';
import type React from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
}

const Button = ({ className, ...props }: Props) => {
    return (
        <button
            className={clsx(
                'flex items-center justify-center h-8 px-4 text-sm font-medium text-primary transition-colors duration-150 bg-linear-to-b from-overlay/6 to-overlay/4 border border-overlay/8 rounded-full shadow-xs hover:from-overlay/2 hover:to-overlay/2 cursor-pointer',
                className,
            )}
            {...props}
        />
    );
};
Button.displayName = 'Button';

export default Button;
