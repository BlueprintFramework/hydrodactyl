import clsx from 'clsx';

interface Props {
    children: React.ReactNode;
    className?: string;
}

const ContentRow = ({ children, className }: Props) => {
    return (
        <div
            className={clsx(
                className,
                'flex items-center gap-3 w-full',
            )}
        >
            {children}
        </div>
    );
};

export { ContentRow };
export default ContentRow;

interface IconProps {
    children: React.ReactNode;
    className?: string;
}

const RowIcon = ({ children, className }: IconProps) => {
    return (
        <div
            className={clsx(
                className,
                'flex-shrink-0 w-9 h-9 rounded-lg bg-[#ffffff11] flex items-center justify-center',
            )}
        >
            {children}
        </div>
    );
};

interface BodyProps {
    children: React.ReactNode;
    className?: string;
}

const RowBody = ({ children, className }: BodyProps) => {
    return (
        <div className={clsx(className, 'flex-1 min-w-0')}>
            {children}
        </div>
    );
};

interface TitleLineProps {
    children: React.ReactNode;
    className?: string;
}

const RowTitleLine = ({ children, className }: TitleLineProps) => {
    return (
        <div className={clsx(className, 'flex items-center gap-2 mb-1.5')}>
            {children}
        </div>
    );
};

interface TitleProps {
    children: React.ReactNode;
    className?: string;
}

const RowTitle = ({ children, className }: TitleProps) => {
    return (
        <h3 className={clsx(className, 'text-sm font-medium text-zinc-100 truncate')}>
            {children}
        </h3>
    );
};

interface DescriptionProps {
    children: React.ReactNode;
    className?: string;
}

const RowDescription = ({ children, className }: DescriptionProps) => {
    return (
        <p className={clsx(className, 'text-xs text-zinc-400')}>
            {children}
        </p>
    );
};

interface ActionsProps {
    children: React.ReactNode;
    className?: string;
}

const RowActions = ({ children, className }: ActionsProps) => {
    return (
        <div className={clsx(className, 'flex-shrink-0 flex items-center gap-2 min-w-[68px] justify-end')}>
            {children}
        </div>
    );
};

export { RowIcon, RowBody, RowTitleLine, RowTitle, RowDescription, RowActions };
