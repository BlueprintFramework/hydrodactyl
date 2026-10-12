import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { deleteNode, type NodeValues, updateNode } from '@/api/admin/nodes';
import { useNode, useNodeOptions } from '@/api/admin/useNodes';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import NodeForm from './NodeForm';

const NodeSettingsContainer = () => {
    const { id } = useParams<'id'>();
    const navigate = useNavigate();
    const { data: node } = useNode(id);
    const { data: options } = useNodeOptions();
    const [resetSecret, setResetSecret] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!node || !options) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    const submit = async (values: NodeValues) => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateNode(node.id, { ...values, reset_secret: resetSecret });
            setResetSecret(false);
            toast.success('Node updated.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to update node.'));
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async () => {
        setDeleting(true);

        try {
            await deleteNode(node.id);
            toast.success('Node deleted.');
            navigate('/nodes');
        } catch (error) {
            toast.error(errorToMessage(error, 'Failed to delete node.'));
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div className='flex flex-col gap-6'>
            <NodeForm
                key={node.id}
                options={options}
                initialValues={{
                    name: node.name,
                    description: node.description ?? '',
                    location_id: String(node.location_id),
                    daemonType: node.daemonType,
                    public: node.public,
                    trust_alias: node.trust_alias,
                    fqdn: node.fqdn,
                    internal_fqdn: node.internal_fqdn ?? '',
                    scheme: node.scheme,
                    behind_proxy: node.behind_proxy,
                    maintenance_mode: node.maintenance_mode,
                    memory: String(node.memory),
                    memory_overallocate: String(node.memory_overallocate),
                    disk: String(node.disk),
                    disk_overallocate: String(node.disk_overallocate),
                    upload_size: String(node.upload_size),
                    daemonListen: String(node.daemonListen),
                    daemonSFTP: String(node.daemonSFTP),
                    backupDisk: node.backupDisk,
                    bucket: node.bucket ? String(node.bucket) : '',
                }}
                submitLabel='Save Changes'
                submitting={submitting}
                errors={errors}
                onSubmit={submit}
                onCancel={() => navigate(`/nodes/${node.id}`)}
                showResetSecret
                resetSecret={resetSecret}
                onResetSecretChange={setResetSecret}
            />

            <div className='rounded-xl border border-brand-400/40 bg-brand-400/5 p-4'>
                <h2 className='text-sm font-semibold text-brand-400'>Delete Node</h2>
                <p className='mt-1 text-sm text-cream-400/70'>
                    A node must have no servers attached before it can be deleted.
                </p>
                <Button
                    variant='attention'
                    className='mt-3'
                    disabled={node.servers_count > 0}
                    onClick={() => setConfirmDelete(true)}
                >
                    Delete Node
                </Button>
            </div>

            <Dialog.Confirm
                open={confirmDelete}
                title='Delete Node'
                confirm='Delete'
                onClose={() => setConfirmDelete(false)}
                onConfirmed={remove}
                loading={deleting}
            >
                Deleting this node is permanent and cannot be undone.
            </Dialog.Confirm>
        </div>
    );
};

export default NodeSettingsContainer;
