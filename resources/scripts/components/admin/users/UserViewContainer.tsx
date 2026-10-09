import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { useLanguages } from '@/api/admin/useLanguages';
import { deleteUser, type UserValues, updateUser } from '@/api/admin/users';
import { useUser } from '@/api/admin/useUsers';
import { Dialog } from '@/components/elements/dialog';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import UserForm from './UserForm';

const UserViewContainer = () => {
    const { id } = useParams<'id'>();
    const navigate = useNavigate();
    const { data: user, mutate } = useUser(id);
    const { data: languages } = useLanguages();
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!user || !languages) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const handleSubmit = async (values: UserValues) => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateUser(user.id, values);
            await mutate();
            toast.success('User updated.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to update user.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);

        try {
            await deleteUser(user.id);
            toast.success('User deleted.');
            navigate('/users');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete user.'));
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const name = [user.name_first, user.name_last].filter(Boolean).join(' ') || user.username;

    return (
        <PageContentBlock title={name}>
            <MainPageHeader direction='column' title={name}>
                <p className='text-sm text-neutral-400'>{user.email}</p>
            </MainPageHeader>

            <UserForm
                languages={languages}
                initialValues={{
                    email: user.email,
                    username: user.username,
                    name_first: user.name_first ?? '',
                    name_last: user.name_last ?? '',
                    language: user.language,
                    root_admin: user.root_admin,
                }}
                submitLabel='Update User'
                submitting={submitting}
                errors={errors}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/users')}
            />

            <div className='mt-6 rounded-xl border border-brand-400/40 bg-brand-400/5 p-4'>
                <h2 className='text-sm font-semibold text-brand-400'>Delete User</h2>
                <p className='mt-1 text-sm text-cream-400/70'>
                    There must be no servers associated with this account in order for it to be deleted.
                </p>
                <Button
                    variant='attention'
                    className='mt-3'
                    disabled={user.servers_count > 0}
                    onClick={() => setConfirmDelete(true)}
                >
                    Delete User
                </Button>
            </div>

            <Dialog.Confirm
                open={confirmDelete}
                title='Delete User'
                confirm='Delete'
                onClose={() => setConfirmDelete(false)}
                onConfirmed={handleDelete}
                loading={deleting}
            >
                Deleting this user is permanent and cannot be undone.
            </Dialog.Confirm>
        </PageContentBlock>
    );
};

export default UserViewContainer;
