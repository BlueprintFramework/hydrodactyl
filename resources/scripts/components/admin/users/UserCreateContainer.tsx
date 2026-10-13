import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { useLanguages } from '@/api/admin/useLanguages';
import { createUser, type UserValues } from '@/api/admin/users';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { useTranslation } from '@/i18n/I18nProvider';
import UserForm from './UserForm';

const UserCreateContainer = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: languages } = useLanguages();
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (values: UserValues) => {
        setSubmitting(true);
        setErrors({});

        try {
            const user = await createUser(values);
            toast.success(t('admin.users.created'));
            navigate(`/users/${user.id}`);
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.users.create_failed')));
            setSubmitting(false);
        }
    };

    if (!languages) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return (
        <PageContentBlock title={t('admin.users.create')}>
            <MainPageHeader direction='column' title={t('admin.users.create')}>
                <p className='text-sm text-neutral-400'>{t('admin.users.create_description')}</p>
            </MainPageHeader>

            <UserForm
                languages={languages}
                submitLabel={t('admin.users.create')}
                submitting={submitting}
                errors={errors}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/users')}
            />
        </PageContentBlock>
    );
};

export default UserCreateContainer;
