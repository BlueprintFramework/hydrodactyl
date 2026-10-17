import { NavLink } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

const NewFileButton = ({ id }: { id: string }) => {
    const { t } = useTranslation();

    return (
        <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
            <Button variant='secondary' className='border-l-cream-600 rounded-l-none'>
                {t('server.files.new_file')}
            </Button>
        </NavLink>
    );
};

export default NewFileButton;
