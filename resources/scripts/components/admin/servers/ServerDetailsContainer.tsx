import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { type AdminServer, updateServerDetails } from '@/api/admin/servers';
import { useServer } from '@/api/admin/useServers';
import { Field } from '@/components/admin/Field';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import OwnerSelect from './OwnerSelect';

const ServerDetailsForm = ({ server, onSaved }: { server: AdminServer; onSaved: () => Promise<unknown> }) => {
    const [name, setName] = useState(server.name);
    const [externalId, setExternalId] = useState(server.external_id ?? '');
    const [description, setDescription] = useState(server.description ?? '');
    const [ownerId, setOwnerId] = useState(server.owner?.id ?? 0);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const submit = async () => {
        setSubmitting(true);
        setErrors({});

        try {
            await updateServerDetails(server.id, {
                name,
                external_id: externalId,
                owner_id: ownerId,
                description,
            });
            await onSaved();
            toast.success('Server details updated.');
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, 'Failed to update server details.'));
        } finally {
            setSubmitting(false);
        }
    };

    const ownerLabel = server.owner
        ? `${[server.owner.name_first, server.owner.name_last].filter(Boolean).join(' ')} (${server.owner.email})`.trim()
        : '';

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}
            className='flex flex-col gap-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'
        >
            <Field label='Server Name' error={errors.name} hint='Allowed characters: a-z, A-Z, 0-9, _ and -.'>
                <Input.Text value={name} onChange={(event) => setName(event.target.value)} />
            </Field>

            <Field
                label='External Identifier'
                error={errors.external_id}
                hint='Leave empty to not assign an external identifier for this server.'
            >
                <Input.Text value={externalId} onChange={(event) => setExternalId(event.target.value)} />
            </Field>

            <Field
                label='Server Owner'
                hint='Changing the owner will automatically generate a new daemon security token.'
            >
                <OwnerSelect initialLabel={ownerLabel} onChange={setOwnerId} error={errors.owner_id} />
            </Field>

            <Field label='Server Description' error={errors.description} hint='A brief description of this server.'>
                <Input.Text value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>

            <div className='flex justify-end'>
                <Button type='submit' disabled={submitting}>
                    Update Details
                </Button>
            </div>
        </form>
    );
};

const ServerDetailsContainer = () => {
    const { id } = useParams<'id'>();
    const { data: server, mutate } = useServer(id);

    if (!server) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner centered size={Spinner.Size.LARGE} />
            </div>
        );
    }

    return <ServerDetailsForm key={server.id} server={server} onSaved={mutate} />;
};

export default ServerDetailsContainer;
