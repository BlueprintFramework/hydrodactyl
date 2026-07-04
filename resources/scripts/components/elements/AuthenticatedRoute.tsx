import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useStoreState } from '@/state/hooks';

function AuthenticatedRoute({ children }: { children?: ReactNode }): JSX.Element {
    const isAuthenticated = useStoreState((state) => !!state.user.data?.uuid);

    const location = useLocation();

    if (isAuthenticated) {
        return <>{children}</>;
    }

    // Fresh install with no users yet — guide the visitor to first-run setup
    // instead of the (empty) login page.
    if ((window as { SetupRequired?: boolean }).SetupRequired) {
        return <Navigate to='/setup' replace />;
    }

    return <Navigate to='/auth/login' state={{ from: location.pathname }} />;
}

export default AuthenticatedRoute;
