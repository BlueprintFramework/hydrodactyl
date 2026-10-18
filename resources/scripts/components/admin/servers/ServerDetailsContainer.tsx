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
import { useTranslation } from '@/i18n/I18nProvider';
import OwnerSelect from './OwnerSelect';

const ServerDetailsForm = ({ server, onSaved }: { server: AdminServer; onSaved: () => Promise<unknown> }) => {
    const { t } = useTranslation();
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
            toast.success(t('admin.servers.details_updated'));
        } catch (error) {
            setErrors(parseValidationErrors(error));
            toast.error(errorToMessage(error, t('admin.servers.details_update_failed')));
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
            <Field
                label={t('admin.servers.server_name')}
                error={errors.name}
                hint={t('admin.servers.server_name_hint_details')}
            >
                <Input.Text value={name} onChange={(event) => setName(event.target.value)} />
            </Field>

            <Field
                label={t('admin.servers.external_identifier')}
                error={errors.external_id}
                hint={t('admin.servers.external_id_hint')}
            >
                <Input.Text value={externalId} onChange={(event) => setExternalId(event.target.value)} />
            </Field>

            <Field label={t('admin.servers.server_owner')} hint={t('admin.servers.server_owner_hint_details')}>
                <OwnerSelect initialLabel={ownerLabel} onChange={setOwnerId} error={errors.owner_id} />
            </Field>

            <Field
                label={t('admin.servers.server_description')}
                error={errors.description}
                hint={t('admin.servers.server_description_hint')}
            >
                <Input.Text value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>

            <div className='flex justify-end'>
                <Button type='submit' disabled={submitting}>
                    {t('admin.servers.update_details')}
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
