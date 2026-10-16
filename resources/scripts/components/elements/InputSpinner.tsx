import styled, { css } from 'styled-components';

import Select from '@/components/elements/Select';
import Spinner from '@/components/elements/Spinner';

import FadeTransition from './transitions/FadeTransition';

const Container = styled.div<{ visible?: boolean }>`
    position: relative
        ${(props) =>
            props.visible &&
            css`
                & ${Select} {
                    background-image: none;
                }
            `};
`;

const InputSpinner = ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (
    <Container visible={visible}>
        <FadeTransition show={visible} duration='duration-150' appear unmount>
            <div className='pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center pr-3'>
                <Spinner size='small' />
            </div>
        </FadeTransition>
        {children}
    </Container>
);

export default InputSpinner;
