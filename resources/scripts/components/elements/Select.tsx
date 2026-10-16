import styled, { css } from "styled-components";

interface Props {
    hideDropdownArrow?: boolean;
}

const Select = styled.select<Props>`
    -webkit-appearance: none;
    -moz-appearance: none;
    color-scheme: dark;
    color: #f4f4f5;
    background-size: 1rem;
    background-repeat: no-repeat;
    background-position-x: calc(100% - 0.75rem);
    background-position-y: center;

    &::-ms-expand {
        display: none;
    }

    option {
        background-color: #27272a;
        color: #f4f4f5;
    }

    ${(props) =>
        !props.hideDropdownArrow &&
        css`
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='%23C3D1DF' d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z'/%3e%3c/svg%3e ");
        `};
`;

export default Select;
