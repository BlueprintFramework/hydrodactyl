import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { createNode, type NodeValues } from '@/api/admin/nodes';
import { useNodeOptions } from '@/api/admin/useNodes';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import NodeForm, { emptyNodeValues } from './NodeForm';

const NodeCreateContainer = () => {
    const navigate = useNavigate();
    const { data: options } = useNodeOptions();
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!options) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const submit = async (values: NodeValues) => {
        setSubmitting(true);
        setErrors({});

        try {
            const node = await createNode(values);
            toast.success('Node created.');
            navigate(`/nodes/${node.id}`);
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to create node.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContentBlock title='Create Node'>
            <MainPageHeader direction='column' title='Create Node'>
                <p className='text-sm text-neutral-400'>Provision a new node to run servers on.</p>
            </MainPageHeader>

            <NodeForm
                options={options}
                initialValues={emptyNodeValues}
                submitLabel='Create Node'
                submitting={submitting}
                errors={errors}
                onSubmit={submit}
                onCancel={() => navigate('/nodes')}
            />
        </PageContentBlock>
    );
};

export default NodeCreateContainer;
