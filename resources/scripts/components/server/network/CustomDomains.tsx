import { ChevronDown } from '@gravity-ui/icons';
import { Field, Form, Formik, type FormikHelpers } from 'formik';
import { useCallback, useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import * as yup from 'yup';
import type { Allocation } from '@/api/server/getServer';
import {
    type CustomDomain,
    type CustomDomainInfo,
    createCustomDomain,
    deleteCustomDomain,
    getCustomDomains,
    updateCustomDomain,
} from '@/api/server/network/customDomains';
import Can from '@/components/elements/Can';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFlashKey } from '@/plugins/useFlash';
import { useStoreState } from '@/state/hooks';
import { ServerContext } from '@/state/server';

interface AddFormValues {
    hostname: string;
    allocation_id: string;
    api_token: string;
}

interface EditFormValues {
    subdomain: string;
    allocation_id: string;
}

const addValidationSchema = yup.object().shape({
    hostname: yup
        .string()
        .required('A domain is required.')
        .max(191, 'Domain cannot exceed 191 characters.')
        .matches(
            /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i,
            'Enter a full domain name, such as play.example.com.',
        ),
    api_token: yup.string().required('A Cloudflare API token is required.'),
});

const editValidationSchema = yup.object().shape({
    subdomain: yup
        .string()
        .max(191, 'Subdomain cannot exceed 191 characters.')
        .matches(
            /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*)?$/i,
            'Subdomain can only contain letters, numbers, and hyphens.',
        ),
});

// Opens Cloudflare's token form with the Zone > DNS > Edit permission already selected
// and the token named after the panel.
const cloudflareTokenUrl = (panelName: string): string =>
    `https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=${encodeURIComponent(
        JSON.stringify([{ key: 'dns', type: 'edit' }]),
    )}&accountId=*&zoneId=all&name=${encodeURIComponent(`${panelName} DNS`)}`;

const inputClassName =
    'w-full border border-[#ffffff15] bg-transparent px-4 py-3 text-white placeholder-zinc-400 outline-none focus:ring-0 hover:border-[#ffffff25] transition-colors';

const allocationLabel = (allocation?: Allocation): string =>
    allocation
        ? `${allocation.ip}:${allocation.port}${allocation.isDefault ? ' (primary)' : ''}`
        : 'Select an allocation';

// The part of a custom domain in front of the user's Cloudflare domain, empty for the root.
const subdomainOf = (domain: CustomDomain): string =>
    domain.hostname === domain.zone_name ? '' : domain.hostname.slice(0, -(domain.zone_name.length + 1));

interface AllocationPickerProps {
    allocations: Allocation[];
    value: string;
    onChange: (value: string) => void;
}

const AllocationPicker = ({ allocations, value, onChange }: AllocationPickerProps) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button
                type='button'
                className='flex w-full items-center justify-between gap-2 rounded-xl border border-mocha-300/50 bg-mocha-400/50 px-3 py-3 text-sm text-cream-400 focus:border-brand-400/60 focus:outline-none'
            >
                <span className='truncate text-left'>
                    {allocationLabel(allocations.find((allocation) => String(allocation.id) === value))}
                </span>
                <ChevronDown width={14} height={14} fill='currentColor' className='shrink-0 text-cream-400/40' />
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='z-99999'>
            <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
                {allocations.map((allocation) => (
                    <DropdownMenuRadioItem key={allocation.id} value={String(allocation.id)}>
                        {allocationLabel(allocation)}
                    </DropdownMenuRadioItem>
                ))}
            </DropdownMenuRadioGroup>
        </DropdownMenuContent>
    </DropdownMenu>
);

const CustomDomains = () => {
    const [info, setInfo] = useState<CustomDomainInfo | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editing, setEditing] = useState<number | null>(null);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [pendingRemoval, setPendingRemoval] = useState<CustomDomain | null>(null);

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const panelName = useStoreState((state) => state.settings.data?.name || 'Hydrodactyl Panel');
    const allocations = ServerContext.useStoreState((state) => state.server.data?.allocations ?? [], isEqual);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network:custom-domains');

    const loadDomains = useCallback(async () => {
        if (!uuid) return;

        try {
            setInfo(await getCustomDomains(uuid));
        } catch (_error) {
            // Users without the custom domain permission simply don't see this section.
            setInfo(null);
        }
    }, [uuid]);

    useEffect(() => {
        loadDomains();
    }, [loadDomains]);

    const handleAddDomain = async (
        values: AddFormValues,
        { setSubmitting, resetForm }: FormikHelpers<AddFormValues>,
    ) => {
        if (!uuid) return;

        try {
            clearFlashes();
            await createCustomDomain(
                uuid,
                values.hostname.trim().toLowerCase(),
                values.api_token.trim(),
                values.allocation_id ? parseInt(values.allocation_id, 10) : null,
            );
            await loadDomains();
            resetForm();
            setIsAdding(false);
        } catch (error) {
            clearAndAddHttpError(error as Error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditDomain = async (
        domain: CustomDomain,
        values: EditFormValues,
        { setSubmitting }: FormikHelpers<EditFormValues>,
    ) => {
        if (!uuid) return;

        try {
            clearFlashes();
            await updateCustomDomain(
                uuid,
                domain.id,
                values.subdomain.trim().toLowerCase(),
                values.allocation_id ? parseInt(values.allocation_id, 10) : null,
            );
            await loadDomains();
            setEditing(null);
        } catch (error) {
            clearAndAddHttpError(error as Error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteDomain = async (domain: CustomDomain) => {
        if (!uuid) return;

        // Close the confirmation straight away; the button shows the progress.
        setPendingRemoval(null);

        try {
            clearFlashes();
            setDeleting(domain.id);
            await deleteCustomDomain(uuid, domain.id);
            await loadDomains();
        } catch (error) {
            clearAndAddHttpError(error as Error);
        } finally {
            setDeleting(null);
        }
    };

    // Nothing to show when custom domains are off for this server and none are left to remove.
    if (!info || (!info.enabled && info.data.length === 0)) {
        return null;
    }

    const primaryAllocation = allocations.find((allocation) => allocation.isDefault);

    return (
        <div className='mt-6 pt-6 border-t border-[#ffffff15]'>
            <div className='flex items-center justify-between gap-3 mb-4'>
                <div>
                    <h4 className='text-md font-medium text-zinc-200'>Custom Domain</h4>
                    <p className='text-sm text-zinc-400'>
                        Point a domain from your own Cloudflare account at this server.
                    </p>
                </div>
                {info.enabled && !isAdding && info.data.length === 0 && (
                    <Can action={'allocation.custom_domain_update'}>
                        <Button type='button' variant='secondary' onClick={() => setIsAdding(true)}>
                            Add Domain
                        </Button>
                    </Can>
                )}
            </div>

            <ConfirmationModal
                title={`Remove ${pendingRemoval?.hostname}?`}
                buttonText={`Remove ${pendingRemoval?.hostname}`}
                visible={pendingRemoval !== null}
                onConfirmed={() => pendingRemoval && handleDeleteDomain(pendingRemoval)}
                onModalDismissed={() => setPendingRemoval(null)}
            >
                This will delete the autogenerated DNS records.
            </ConfirmationModal>

            <FlashMessageRender byKey={'server:network:custom-domains'} />

            {info.data.map((domain) =>
                editing === domain.id ? (
                    <Formik
                        key={domain.id}
                        initialValues={{
                            subdomain: subdomainOf(domain),
                            allocation_id: String(domain.allocation_id),
                        }}
                        validationSchema={editValidationSchema}
                        onSubmit={(values, helpers) => handleEditDomain(domain, values, helpers)}
                    >
                        {({ values, setFieldValue, isSubmitting, isValid }) => (
                            <Form className='space-y-4 mb-4'>
                                <FormikFieldWrapper
                                    name='subdomain'
                                    label='Subdomain'
                                    description='Leave this empty to use the domain itself. The DNS records are moved as soon as you save.'
                                >
                                    <div className='flex items-center overflow-hidden rounded-xl border border-mocha-300/50 bg-mocha-400/50 focus-within:border-brand-400/60'>
                                        <Field
                                            name='subdomain'
                                            placeholder='play'
                                            className='flex-1 border-0 bg-transparent px-4 py-3 text-sm text-cream-400 outline-none placeholder:text-cream-400/40 focus:ring-0'
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                setFieldValue(
                                                    'subdomain',
                                                    e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''),
                                                )
                                            }
                                        />
                                        <div className='self-stretch flex items-center border-l border-mocha-300/50 px-3 text-sm text-cream-400'>
                                            .{domain.zone_name}
                                        </div>
                                    </div>
                                </FormikFieldWrapper>
                                <FormikFieldWrapper
                                    name='allocation_id'
                                    label='Allocations'
                                    description='The allocation on this server the domain should point at.'
                                >
                                    <AllocationPicker
                                        allocations={allocations}
                                        value={values.allocation_id}
                                        onChange={(value) => setFieldValue('allocation_id', value)}
                                    />
                                </FormikFieldWrapper>
                                <div className='flex items-center justify-end gap-3 pt-4 border-t border-[#ffffff15]'>
                                    <Button
                                        type='button'
                                        variant='secondary'
                                        onClick={() => {
                                            clearFlashes();
                                            setEditing(null);
                                        }}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type='submit' variant='secondary' disabled={isSubmitting || !isValid}>
                                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                ) : (
                    <div key={domain.id} className='space-y-4 mb-4'>
                        <div className='bg-[#ffffff08] border border-[#ffffff15] rounded-lg p-4'>
                            <p className='text-sm text-zinc-400 mb-2'>Current Custom Domain</p>
                            <p className='text-lg font-medium text-white font-mono'>{domain.hostname}</p>
                            <p className='text-sm text-zinc-400 mt-2'>
                                Points to {domain.ip}:{domain.port}
                            </p>
                        </div>
                        <Can action={'allocation.custom_domain_update'}>
                            <div className='flex items-center justify-end gap-3 pt-4 border-t border-[#ffffff15]'>
                                <Button
                                    type='button'
                                    variant='attention'
                                    onClick={() => setPendingRemoval(domain)}
                                    disabled={deleting === domain.id}
                                >
                                    {deleting === domain.id ? 'Deleting...' : 'Delete Domain'}
                                </Button>
                                {info.enabled && (
                                    <Button
                                        type='button'
                                        variant='secondary'
                                        onClick={() => {
                                            clearFlashes();
                                            setEditing(domain.id);
                                        }}
                                        disabled={deleting === domain.id}
                                    >
                                        Edit Domain
                                    </Button>
                                )}
                            </div>
                        </Can>
                    </div>
                ),
            )}

            {info.enabled && isAdding && (
                <Formik
                    initialValues={{
                        hostname: '',
                        allocation_id: primaryAllocation ? String(primaryAllocation.id) : '',
                        api_token: '',
                    }}
                    validationSchema={addValidationSchema}
                    onSubmit={handleAddDomain}
                >
                    {({ values, setFieldValue, isSubmitting, isValid, dirty, resetForm }) => (
                        <Form className='space-y-4'>
                            <FormikFieldWrapper
                                name='hostname'
                                label='Domain'
                                description='The full address players will use, such as play.example.com or example.com. The domain must be on your Cloudflare account.'
                            >
                                <Field
                                    name='hostname'
                                    placeholder='play.example.com or example.com'
                                    className={inputClassName}
                                />
                            </FormikFieldWrapper>
                            {allocations.length > 1 && (
                                <FormikFieldWrapper
                                    name='allocation_id'
                                    label='Allocations'
                                    description='The allocation on this server the domain should point at.'
                                >
                                    <AllocationPicker
                                        allocations={allocations}
                                        value={values.allocation_id}
                                        onChange={(value) => setFieldValue('allocation_id', value)}
                                    />
                                </FormikFieldWrapper>
                            )}
                            <FormikFieldWrapper
                                name='api_token'
                                label={
                                    <>
                                        Cloudflare API Token (Create one{' '}
                                        <a
                                            href={cloudflareTokenUrl(panelName)}
                                            aria-label='Create a Cloudflare API token'
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-brand underline'
                                        >
                                            here
                                        </a>
                                        )
                                    </>
                                }
                                description='The link opens Cloudflare with the DNS edit permission already selected.'
                            >
                                <Field
                                    name='api_token'
                                    type='password'
                                    autoComplete='off'
                                    placeholder='Cloudflare API token'
                                    className={inputClassName}
                                />
                            </FormikFieldWrapper>
                            <div className='flex items-center justify-end gap-3'>
                                <Button
                                    type='button'
                                    variant='secondary'
                                    onClick={() => {
                                        resetForm();
                                        clearFlashes();
                                        setIsAdding(false);
                                    }}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type='submit' variant='secondary' disabled={isSubmitting || !isValid || !dirty}>
                                    {isSubmitting ? 'Adding DNS records...' : 'Add Domain'}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            )}
        </div>
    );
};

export default CustomDomains;
