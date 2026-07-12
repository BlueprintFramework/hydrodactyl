import clsx from 'clsx';
import styled, { css } from 'styled-components';

import Spinner from '@/components/elements/Spinner';

interface Props {
    isLoading?: boolean;
    size?: 'xsmall' | 'small' | 'large' | 'xlarge';
    color?: 'green' | 'red' | 'primary' | 'grey';
    isSecondary?: boolean;
}

// Only min-height + font-size here. Padding is intentionally owned by each
// call site's className — emitting padding here would fight it on equal
// specificity (single-class selectors), making the winner injection-order
// dependent.
const SIZES = {
    xsmall: css`
        min-height: 1.5rem;
        font-size: 0.75rem;
    `,
    small: css`
        min-height: 2rem;
        font-size: 0.875rem;
    `,
    large: css`
        min-height: 2.75rem;
        font-size: 0.95rem;
    `,
    xlarge: css`
        min-height: 3rem;
        font-size: 1rem;
    `,
} as const;

const ButtonStyle = styled.button<Omit<Props, 'isLoading'>>`
    position: relative;
    ${({ size }) => size && SIZES[size]}
`;

type ComponentProps = Omit<JSX.IntrinsicElements['button'], 'ref' | keyof Props> & Props;

const Button: React.FC<ComponentProps> = ({ children, isLoading, ...props }) => (
    <ButtonStyle {...props}>
        {isLoading && (
            <div className={`flex absolute justify-center items-center w-full h-full left-0 top-0`}>
                <Spinner size={'small'} />
            </div>
        )}
        <span
            className={clsx({
                'opacity-0': isLoading,
                'pointer-events-none': isLoading,
            })}
        >
            {children}
        </span>
    </ButtonStyle>
);

type LinkProps = Omit<JSX.IntrinsicElements['a'], 'ref' | keyof Props> & Props;

const LinkButton: React.FC<LinkProps> = (props) => <ButtonStyle as={'a'} {...props} />;

export { ButtonStyle, LinkButton };
export default Button;
