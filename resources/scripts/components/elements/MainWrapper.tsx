import styled from 'styled-components';

const MainWrapper = styled.div`
    width: 100%;
    height: 100%;

    /* On mobile, reserve space for the fixed BottomNav (h-14 = 3.5rem + safe-area)
       so every page's internal scroll area ends above it instead of being
       overlapped. Desktop (>=lg) is unaffected — the nav is hidden there. */
    @media (max-width: 1023px) {
        padding-bottom: calc(3.5rem + env(safe-area-inset-bottom));
    }
`;

export default MainWrapper;
