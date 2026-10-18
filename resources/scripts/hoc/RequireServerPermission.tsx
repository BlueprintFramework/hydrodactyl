import Can from '@/components/elements/Can';
import { ServerError } from '@/components/elements/ScreenBlock';

import { useTranslation } from '@/i18n/I18nProvider';

export interface RequireServerPermissionProps {
    permissions: string | string[];
    children?: React.ReactNode;
}

const RequireServerPermission: React.FC<RequireServerPermissionProps> = ({ children, permissions }) => {
    const { t } = useTranslation();

    return (
        <Can
            action={permissions}
            renderOnError={
                <ServerError title={t('errors.access_denied.title')} message={t('errors.access_denied.description')} />
            }
        >
            {children}
        </Can>
    );
};

export default RequireServerPermission;
