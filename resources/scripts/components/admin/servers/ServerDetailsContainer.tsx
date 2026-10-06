import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import useSWR from 'swr';
import { useDebounce } from 'use-debounce';
import { errorToMessage, parseValidationErrors } from '@/api/admin/errors';
import { type AdminServer, searchUsers, updateServerDetails } from '@/api/admin/servers';
import { useServer } from '@/api/admin/useServers';
import { Field } from '@/components/admin/Field';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';

const OwnerSelect = ({
    initialLabel,
    onChange,
    error,
}: {
    initialLabel: string;
    onChange: (id: number) => void;
    error?: string;
}) => {
    const [label, setLabel] = useState(initialLabel);
    const [term, setTerm] = useState('');
    const [debounced] = useDebounce(term, 300);
    const { data, isValidating } = useSWR(
        debounced.length >= 2 ? ['admin:user-search', debounced] : null,
        () => searchUsers(debounced),
        { revalidateOnFocus: false },
    );

    const results = data ?? [];

    return (
        <div className='flex flex-col gap-2'>
            <div className='rounded-lg bg-[#ffffff11] px-4 py-2 text-sm text-cream-100'>{label}</div>
            <Input.Text
                placeholder='Search by email to change owner…'
                value={term}
                onChange={(event) => setTerm(event.target.value)}
            />
            {debounced.length >= 2 && (
                <div className='max-h-48 overflow-y-auto rounded-lg border border-mocha-400'>
                    {results.map((user) => (
                        <button
                            key={user.id}
                            type='button'
                            onClick={() => {
                                onChange(user.id);
                                setLabel(
                                    `${[user.name_first, user.name_last].filter(Boolean).join(' ')} (${user.email})`.trim(),
                                );
                                setTerm('');
                            }}
                            className='block w-full px-3 py-2 text-left text-sm hover:bg-mocha-400/40'
                        >
                            <span className='text-cream-100'>
                                {[user.name_first, user.name_last].filter(Boolean).join(' ') || user.username}
                            </span>{' '}
                            <span className='text-cream-400/60'>({user.email})</span>
                        </button>
                    ))}
                    {!isValidating && results.length === 0 && (
                        <div className='px-3 py-2 text-sm text-cream-400/50'>No users found.</div>
                    )}
                </div>
            )}
            {error && <span className='text-xs text-brand-600'>{error}</span>}
        </div>
    );
};

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
