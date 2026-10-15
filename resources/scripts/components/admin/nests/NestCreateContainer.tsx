import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { createNest } from '@/api/admin/nests';
import { Field } from '@/components/admin/Field';
import { Input } from '@/components/elements/inputs';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { Button } from '@/components/ui/button';

const NestCreateContainer = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            const nest = await createNest({ name, description });
            toast.success('Nest created.');
            navigate(`/nests/${nest.id}`);
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to create the nest.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContentBlock title='Create Nest'>
            <MainPageHeader direction='column' title='Create Nest'>
                <p className='text-sm text-neutral-400'>Create a new nest to organize eggs.</p>
            </MainPageHeader>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                }}
                className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'
            >
                <Field label='Name' error={errors.name} hint='Must be unique, 1-191 characters.'>
                    <Input.Text value={name} onChange={(event) => setName(event.target.value)} />
                </Field>
                <Field label='Description' error={errors.description}>
                    <Input.Text value={description} onChange={(event) => setDescription(event.target.value)} />
                </Field>
                <div className='flex justify-end gap-2'>
                    <Button type='button' variant='secondary' disabled={submitting} onClick={() => navigate('/nests')}>
                        Cancel
                    </Button>
                    <Button type='submit' disabled={submitting}>
                        Create Nest
                    </Button>
                </div>
            </form>
        </PageContentBlock>
    );
};

export default NestCreateContainer;
