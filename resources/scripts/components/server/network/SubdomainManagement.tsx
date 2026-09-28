import { Field, Form, Formik, type FormikHelpers } from 'formik';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as yup from 'yup';
import {
    checkSubdomainAvailability,
    deleteSubdomain,
    getSubdomainInfo,
    type SubdomainInfo,
    setSubdomain,
} from '@/api/server/network/subdomain';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { Translate } from '@/i18n/types';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface AvailableDomain {
    id: number;
    name: string;
    is_active: boolean;
    is_default: boolean;
}

interface SubdomainFormValues {
    subdomain: string;
    domain_id: string;
}

const CleanInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className = '', ...props }, ref) => (
        <input
            ref={ref}
            className={`border-0 bg-transparent focus:ring-0 outline-none text-white placeholder-zinc-400 ${className}`}
            {...props}
        />
    ),
);
CleanInput.displayName = 'CleanInput';

const CleanSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className = '', children, ...props }, ref) => (
        <select
            ref={ref}
            className={`border-0 bg-transparent focus:ring-0 outline-none text-zinc-300 ${className}`}
            {...props}
        >
            {children}
        </select>
    ),
);
CleanSelect.displayName = 'CleanSelect';

const createValidationSchema = (t: Translate) =>
    yup.object().shape({
        subdomain: yup
            .string()
            .required(t('server.network.subdomain.name_required'))
            .min(1, t('server.network.subdomain.min_length'))
            .max(63, t('server.network.subdomain.max_length'))
            .matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i, t('server.network.subdomain.format')),
        domain_id: yup.string().required(t('server.network.subdomain.domain_required')),
    });

interface Props {
    onClose?: () => void;
}

const SubdomainManagement = ({ onClose: _onClose }: Props) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [subdomainInfo, setSubdomainInfo] = useState<SubdomainInfo | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [availabilityStatus, setAvailabilityStatus] = useState<{
        checked: boolean;
        available: boolean;
        message: string;
    } | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network:subdomain');

    const validationSchema = useMemo(() => createValidationSchema(t), [t]);

    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const loadSubdomainInfo = useCallback(async () => {
        try {
            clearFlashes();
            const data = await getSubdomainInfo(uuid);
            setSubdomainInfo(data);
        } catch (error) {
            clearAndAddHttpError(error as Error);
        }
    }, [uuid, clearFlashes, clearAndAddHttpError]);

    useEffect(() => {
        loadSubdomainInfo();
    }, [loadSubdomainInfo]);

    const checkAvailability = useCallback(
        async (subdomain: string, domainId: string) => {
            if (!subdomain?.trim() || !domainId) {
                setAvailabilityStatus(null);
                return;
            }

            // Don't check availability for current subdomain unless domain changed
            if (
                subdomainInfo?.current_subdomain &&
                subdomainInfo.current_subdomain.attributes.subdomain === subdomain.trim() &&
                subdomainInfo.current_subdomain.attributes.domain_id.toString() === domainId
            ) {
                setAvailabilityStatus(null);
                return;
            }

            try {
                setCheckingAvailability(true);
                const response = await checkSubdomainAvailability(uuid, subdomain.trim(), parseInt(domainId, 10));
                setAvailabilityStatus({
                    checked: true,
                    available: response.available,
                    message: response.message,
                });
            } catch (_error) {
                setAvailabilityStatus({
                    checked: true,
                    available: false,
                    message: t('server.network.subdomain.check_failed'),
                });
            } finally {
                setCheckingAvailability(false);
            }
        },
        [uuid, t, subdomainInfo?.current_subdomain],
    );

    const debouncedCheckAvailability = useCallback(
        (subdomain: string, domainId: string) => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            debounceTimeoutRef.current = setTimeout(() => {
                checkAvailability(subdomain, domainId);
            }, 500);
        },
        [checkAvailability],
    );

    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    const handleSetSubdomain = async (
        values: SubdomainFormValues,
        { setSubmitting, resetForm }: FormikHelpers<SubdomainFormValues>,
    ) => {
        try {
            clearFlashes();
            setLoading(true);
            await setSubdomain(uuid, values.subdomain.trim(), parseInt(values.domain_id, 10));
            await loadSubdomainInfo();
            setAvailabilityStatus(null);
            if (isEditing) {
                setIsEditing(false);
            } else {
                resetForm();
            }
        } catch (error) {
            clearAndAddHttpError(error as Error);
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    const handleDeleteSubdomain = async () => {
        if (!confirm(t('server.network.subdomain.delete_confirm'))) {
            return;
        }

        try {
            clearFlashes();
            setLoading(true);
            await deleteSubdomain(uuid);
            await loadSubdomainInfo();
            setAvailabilityStatus(null);
        } catch (error) {
            clearAndAddHttpError(error as Error);
        } finally {
            setLoading(false);
        }
    };

    if (!subdomainInfo) {
        return (
            <div className='flex items-center justify-center py-12'>
                <div className='flex flex-col items-center gap-3'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-brand'></div>
                    <p className='text-sm text-neutral-400'>{t('server.network.subdomain.loading')}</p>
                </div>
            </div>
        );
    }

    if (!subdomainInfo?.supported) {
        return null;
    }

    if (!subdomainInfo?.available_domains || subdomainInfo.available_domains.length === 0) {
        return (
            <div className='flex flex-col items-center justify-center py-12'>
                <div className='text-center'>
                    <div className='w-12 h-12 mx-auto mb-3 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                        <svg
                            className='w-6 h-6 text-zinc-400'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                            aria-hidden='true'
                        >
                            <path
                                fillRule='evenodd'
                                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                                clipRule='evenodd'
                            />
                        </svg>
                    </div>
                    <h4 className='text-md font-medium text-zinc-200 mb-1'>
                        {t('server.network.subdomain.no_domains_title')}
                    </h4>
                    <p className='text-sm text-zinc-400 max-w-sm'>
                        {t('server.network.subdomain.no_domains_description')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {subdomainInfo?.current_subdomain && (
                <div className='flex items-center gap-2 text-sm mb-4'>
                    <div
                        className={`w-2 h-2 rounded-full ${subdomainInfo.current_subdomain.attributes.is_active ? 'bg-green-400' : 'bg-red-400'}`}
                    ></div>
                    <span
                        className={
                            subdomainInfo.current_subdomain.attributes.is_active ? 'text-green-400' : 'text-red-400'
                        }
                    >
                        {subdomainInfo.current_subdomain.attributes.is_active
                            ? t('common.active')
                            : t('common.inactive')}
                    </span>
                </div>
            )}

            <FlashMessageRender byKey={'server:network:subdomain'} />

            {subdomainInfo?.current_subdomain && !isEditing ? (
                /* Current Subdomain Display Mode */
                <div className='space-y-4'>
                    <div className='bg-[#ffffff08] border border-[#ffffff15] rounded-lg p-4'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm text-zinc-400 mb-2'>{t('server.network.subdomain.current')}</p>
                                <p className='text-lg font-medium text-white font-mono'>
                                    {subdomainInfo?.current_subdomain?.attributes?.full_domain}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className='flex items-center justify-end gap-3 pt-4 border-t border-[#ffffff15]'>
                        <Button type='button' variant='attention' onClick={handleDeleteSubdomain} disabled={loading}>
                            {loading ? t('server.network.subdomain.deleting') : t('server.network.subdomain.delete')}
                        </Button>
                        <Button type='button' variant='secondary' onClick={() => setIsEditing(true)} disabled={loading}>
                            {t('server.network.subdomain.edit')}
                        </Button>
                    </div>
                </div>
            ) : (
                /* Form Mode (Create or Edit) */
                <Formik
                    initialValues={{
                        subdomain: subdomainInfo?.current_subdomain?.attributes?.subdomain || '',
                        domain_id:
                            subdomainInfo?.current_subdomain?.attributes?.domain_id?.toString() ||
                            (subdomainInfo?.available_domains as AvailableDomain[])
                                ?.find((d) => d.is_default)
                                ?.id.toString() ||
                            subdomainInfo?.available_domains?.[0]?.id.toString() ||
                            '',
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleSetSubdomain}
                    enableReinitialize
                >
                    {({ values, setFieldValue, isSubmitting, isValid, errors: _errors, resetForm }) => (
                        <Form className='space-y-6'>
                            <div className='space-y-4'>
                                <FormikFieldWrapper
                                    name='subdomain'
                                    label={t('server.network.subdomain.label')}
                                    description={t('server.network.subdomain.description')}
                                >
                                    <div className='flex items-center border border-[#ffffff15] overflow-hidden hover:border-[#ffffff25] transition-colors'>
                                        <Field
                                            as={CleanInput}
                                            name='subdomain'
                                            placeholder={t('server.network.subdomain.placeholder')}
                                            className='flex-1 px-4 py-3'
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                                setFieldValue('subdomain', value);
                                                if (values.domain_id && value.trim()) {
                                                    debouncedCheckAvailability(value, values.domain_id);
                                                } else {
                                                    setAvailabilityStatus(null);
                                                    if (debounceTimeoutRef.current) {
                                                        clearTimeout(debounceTimeoutRef.current);
                                                    }
                                                }
                                            }}
                                        />
                                        <div className='border-l border-[#ffffff15]'>
                                            <Field
                                                as={CleanSelect}
                                                name='domain_id'
                                                className='min-w-[140px] px-4 py-3'
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                    const value = e.target.value;
                                                    setFieldValue('domain_id', value);
                                                    if (values.subdomain?.trim()) {
                                                        debouncedCheckAvailability(values.subdomain, value);
                                                    }
                                                }}
                                            >
                                                {(subdomainInfo?.available_domains as AvailableDomain[])?.map(
                                                    (domain) => (
                                                        <option key={domain.id} value={domain.id}>
                                                            .{domain.name}
                                                        </option>
                                                    ),
                                                ) || []}
                                            </Field>
                                        </div>
                                    </div>
                                </FormikFieldWrapper>

                                {/* Availability Status */}
                                {(checkingAvailability || availabilityStatus) && (
                                    <div
                                        className={`rounded-lg p-4 border ${checkingAvailability ? 'bg-blue-500/10 border-blue-500/20' : availabilityStatus?.available ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}
                                    >
                                        {checkingAvailability ? (
                                            <div className='flex items-center text-sm text-blue-300'>
                                                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-3'></div>
                                                {t('server.network.subdomain.checking')}
                                            </div>
                                        ) : (
                                            availabilityStatus && (
                                                <div
                                                    className={`text-sm flex items-center font-medium ${availabilityStatus.available ? 'text-green-300' : 'text-red-300'}`}
                                                >
                                                    <div
                                                        className={`w-3 h-3 rounded-full mr-3 ${availabilityStatus.available ? 'bg-green-400' : 'bg-red-400'}`}
                                                    ></div>
                                                    {availabilityStatus.message}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className='flex items-center justify-end gap-3 pt-6 border-t border-[#ffffff15]'>
                                {isEditing ? (
                                    <>
                                        <Button
                                            type='button'
                                            variant='secondary'
                                            onClick={() => {
                                                setIsEditing(false);
                                                resetForm();
                                                setAvailabilityStatus(null);
                                            }}
                                            disabled={isSubmitting || loading}
                                        >
                                            {t('common.cancel')}
                                        </Button>
                                        <Button
                                            type='submit'
                                            variant='secondary'
                                            disabled={
                                                isSubmitting ||
                                                loading ||
                                                !isValid ||
                                                !values.subdomain.trim() ||
                                                !values.domain_id ||
                                                (availabilityStatus?.checked && !availabilityStatus?.available)
                                            }
                                        >
                                            {isSubmitting
                                                ? t('common.saving')
                                                : t('server.network.subdomain.save_changes')}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        type='submit'
                                        variant='secondary'
                                        disabled={
                                            isSubmitting ||
                                            loading ||
                                            !isValid ||
                                            !values.subdomain.trim() ||
                                            !values.domain_id ||
                                            (availabilityStatus?.checked && !availabilityStatus?.available)
                                        }
                                    >
                                        {isSubmitting
                                            ? t('server.network.subdomain.creating')
                                            : t('server.network.subdomain.create')}
                                    </Button>
                                )}
                            </div>
                        </Form>
                    )}
                </Formik>
            )}
        </div>
    );
};

export default SubdomainManagement;
