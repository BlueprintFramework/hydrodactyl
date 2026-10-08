import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { useLanguages } from '@/api/admin/useLanguages';
import { createUser, type UserValues } from '@/api/admin/users';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import UserForm from './UserForm';

const UserCreateContainer = () => {
    const navigate = useNavigate();
    const { data: languages } = useLanguages();
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (values: UserValues) => {
        setSubmitting(true);
        setErrors({});

        try {
            const user = await createUser(values);
            toast.success('User created.');
            navigate(`/users/${user.id}`);
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to create user.'));
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
        <PageContentBlock title='Create User'>
            <MainPageHeader direction='column' title='Create User'>
                <p className='text-sm text-neutral-400'>Add a new user to the system.</p>
            </MainPageHeader>

            <UserForm
                languages={languages}
                submitLabel='Create User'
                submitting={submitting}
                errors={errors}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/users')}
            />
        </PageContentBlock>
    );
};

export default UserCreateContainer;
