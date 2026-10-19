import styled from 'styled-components';

interface Props {
    hideDropdownArrow?: boolean;
}

const Select = styled.select<Props>`
    appearance: ${(props) => (props.hideDropdownArrow ? 'none' : 'auto')};
    color-scheme: inherit;
    color: var(--color-primary);

    option {
        background-color: var(--color-bg-raised);
        color: var(--color-primary);
    }

`;

export default Select;
