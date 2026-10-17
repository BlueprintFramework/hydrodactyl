import { ChevronRight } from '@gravity-ui/icons';
import { type Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik, useField } from 'formik';
import { useEffect, useState } from 'react';
import { array, object, string } from 'yup';
import createOrUpdateSubuser from '@/api/server/users/createOrUpdateSubuser';
import { Checkbox } from '@/components/elements/CheckboxNew';
import Field from '@/components/elements/Field';
import { Switch } from '@/components/elements/SwitchV2';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/types';
import { useDeepCompareMemo } from '@/plugins/useDeepCompareMemo';
import { usePermissions } from '@/plugins/usePermissions';
import type { ApplicationStore } from '@/state';
import { ServerContext } from '@/state/server';
import type { Subuser } from '@/state/server/subusers';

interface Values {
    email: string;
    permissions: string[];
}

interface Props {
    subuser?: Subuser;
    onSuccess: (subuser: Subuser) => void;
    onCancel: () => void;
    flashKey: string;
    isSubmitting?: boolean;
    setIsSubmitting?: (submitting: boolean) => void;
    identifier?: string;
    onIdentifierChange?: (value: string) => void;
}

const rowClass = 'flex items-start justify-between gap-4 border-b border-[#ffffff10] py-3';

const PermissionGroup = ({
    name,
    description,
    keys,
    editable,
    canEdit,
}: {
    name: string;
    description: string;
    keys: { key: string; description: string }[];
    editable: string[];
    canEdit: boolean;
}) => {
    const { t } = useTranslation();
    const [{ value }, , { setValue }] = useField<string[]>('permissions');

    const translateWithFallback = (path: string, fallback: string) => {
        const translated = t(path as TranslationKey);

        return translated === path ? fallback : translated;
    };

    const groupTitle = translateWithFallback(`server.users.permissions.${name}.title`, name);
    const groupDescription = translateWithFallback(`server.users.permissions.${name}.description`, description);
    const permissions = keys.map((item) => `${name}.${item.key}`);
    const granted = permissions.filter((permission) => value.includes(permission));
    const editableHere = permissions.filter((permission) => editable.includes(permission));
    const allGranted = permissions.length > 0 && granted.length === permissions.length;
    const someGranted = granted.length > 0 && !allGranted;
    const [open, setOpen] = useState(granted.length > 0);

    const setGroup = (on: boolean) => {
        const kept = value.filter((permission) => !permissions.includes(permission));
        setValue(on ? [...kept, ...editableHere] : kept);
    };

    const toggle = (permission: string) => {
        setValue(value.includes(permission) ? value.filter((item) => item !== permission) : [...value, permission]);
    };

    return (
        <div>
            <div className={rowClass}>
                <div className='min-w-0 flex-1'>
                    <button
                        type='button'
                        className='flex cursor-pointer items-center gap-2 text-left'
                        aria-expanded={open}
                        onClick={() => setOpen((current) => !current)}
                    >
                        <ChevronRight
                            width={16}
                            height={16}
                            fill='currentColor'
                            className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-90' : ''}`}
                        />
                        <span className='text-sm first-letter:uppercase text-zinc-100'>{groupTitle}</span>
                        <span className='text-xs text-zinc-500'>
                            {granted.length}/{permissions.length}
                        </span>
                    </button>
                    <p className='mt-1 pl-6 text-sm text-zinc-400'>{groupDescription}</p>
                </div>
                <Switch
                    checked={allGranted || someGranted}
                    disabled={!canEdit || editableHere.length === 0}
                    aria-label={t('server.users.grant_group_aria', { name: groupTitle })}
                    className={someGranted ? 'opacity-60' : undefined}
                    onCheckedChange={(checked) => setGroup(someGranted ? true : checked)}
                />
            </div>
            {open && (
                <div className='grid grid-cols-1 gap-x-10 pb-2 pl-6 sm:grid-cols-2'>
                    {keys.map((item) => {
                        const permission = `${name}.${item.key}`;
                        const disabled = !canEdit || !editable.includes(permission);
                        const checked = value.includes(permission);

                        const inputId = `permission-${permission}`;

                        return (
                            <div key={permission}>
                                <input
                                    id={inputId}
                                    type='checkbox'
                                    className='absolute h-px w-px overflow-hidden opacity-0'
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => toggle(permission)}
                                />
                                <label
                                    htmlFor={inputId}
                                    className={`flex items-start gap-3 border-b border-[#ffffff08] py-2.5 ${
                                        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                    }`}
                                >
                                    <Checkbox
                                        checked={checked}
                                        disabled={disabled}
                                        tabIndex={-1}
                                        aria-hidden
                                        className='pointer-events-none mt-0.5 data-[state=checked]:bg-brand-500/70 data-[state=checked]:border-brand-500/70'
                                    />
                                    <span className='min-w-0'>
                                        <span className='block font-mono text-xs text-zinc-200'>{item.key}</span>
                                        {item.description && (
                                            <span className='mt-0.5 block text-xs leading-relaxed text-zinc-500'>
                                                {translateWithFallback(
                                                    `server.users.permissions.${name}_${item.key}.description`,
                                                    item.description,
                                                )}
                                            </span>
                                        )}
                                    </span>
                                </label>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const UserFormComponent = ({
    subuser,
    onSuccess,
    onCancel,
    flashKey,
    isSubmitting,
    setIsSubmitting,
    identifier,
    onIdentifierChange,
}: Props) => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const appendSubuser = ServerContext.useStoreActions((actions) => actions.subusers.appendSubuser);
    const { clearFlashes, clearAndAddHttpError } = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.flashes,
    );

    const isRootAdmin = useStoreState((state) => state.user.data?.rootAdmin);
    const permissions = useStoreState((state) => state.permissions.data);
    const getPermissions = useStoreActions((actions: Actions<ApplicationStore>) => actions.permissions.getPermissions);
    const loggedInPermissions = ServerContext.useStoreState((state) => state.server.permissions);
    const [canEditUser] = usePermissions(subuser ? ['user.update'] : ['user.create']);
    const permissionsReady = Object.keys(permissions).length > 0;

    useEffect(() => {
        if (permissionsReady) return;

        getPermissions().catch((error) => {
            console.error(error);
            clearAndAddHttpError({ key: flashKey, error });
        });
    }, [permissionsReady, getPermissions, flashKey, clearAndAddHttpError]);

    const editablePermissions = useDeepCompareMemo(() => {
        const list = Object.keys(permissions).flatMap((key) =>
            Object.keys(permissions[key]?.keys ?? {}).map((pkey) => `${key}.${pkey}`),
        );
        if (isRootAdmin || (loggedInPermissions.length === 1 && loggedInPermissions[0] === '*')) {
            return list;
        }
        return list.filter((key) => loggedInPermissions.indexOf(key) >= 0);
    }, [isRootAdmin, permissions, loggedInPermissions]);

    const groups = Object.keys(permissions)
        .filter((key) => key !== 'websocket')
        .map((key) => ({
            name: key,
            description: permissions[key]?.description ?? '',
            keys: Object.keys(permissions[key]?.keys ?? {}).map((pkey) => ({
                key: pkey,
                description: permissions[key]?.keys?.[pkey] ?? '',
            })),
        }));

    const submit = async (values: Values) => {
        if (setIsSubmitting) setIsSubmitting(true);
        clearFlashes(flashKey);
        try {
            const created = await createOrUpdateSubuser(uuid, values, subuser);
            appendSubuser(created);
            onSuccess(created);
        } catch (error) {
            console.error(error);
            if (setIsSubmitting) setIsSubmitting(false);
            clearAndAddHttpError({ key: flashKey, error });
        }
    };

    useEffect(
        () => () => {
            clearFlashes(flashKey);
        },
        [flashKey, clearFlashes],
    );

    return (
        <>
            <FlashMessageRender byKey={flashKey} />

            <Formik
                onSubmit={submit}
                initialValues={
                    {
                        email: subuser?.email || identifier || '',
                        permissions: subuser?.permissions || [],
                    } as Values
                }
                validationSchema={object().shape({
                    email: string()
                        .max(191, t('server.users.identifier_max'))
                        .required(t('server.users.identifier_required')),
                    permissions: array().of(string()),
                })}
            >
                {({ values, setFieldValue }) => {
                    const allSelected =
                        editablePermissions.length > 0 &&
                        editablePermissions.every((permission) => values.permissions.includes(permission));

                    return (
                        <Form className='flex flex-col gap-12'>
                            {!subuser && (
                                <section className='flex flex-col gap-4'>
                                    <div className='max-w-md'>
                                        <Field
                                            id='email'
                                            name='email'
                                            label={t('server.users.identifier_label')}
                                            placeholder={t('server.users.identifier_placeholder')}
                                            description={t('server.users.identifier_description')}
                                            onChange={(event) => onIdentifierChange?.(event.currentTarget.value)}
                                        />
                                    </div>
                                </section>
                            )}

                            <section className='flex flex-col'>
                                <div className='mb-2 flex items-start justify-between gap-4'>
                                    <div>
                                        <h2 className='text-sm font-medium text-zinc-100'>
                                            {t('server.users.detailed_permissions')}
                                        </h2>
                                        <p className='mt-1 max-w-xl text-sm text-zinc-400'>
                                            {t('server.users.permissions_flip')}
                                            {!isRootAdmin && loggedInPermissions[0] !== '*' && (
                                                <> {t('server.users.permission_restriction_description')}</>
                                            )}
                                        </p>
                                    </div>
                                    {canEditUser && permissionsReady && (
                                        <Button
                                            variant='secondary'
                                            size='sm'
                                            type='button'
                                            className='shrink-0'
                                            onClick={() =>
                                                setFieldValue(
                                                    'permissions',
                                                    allSelected ? [] : [...editablePermissions],
                                                )
                                            }
                                        >
                                            {allSelected ? t('server.users.clear_all') : t('server.users.grant_all')}
                                        </Button>
                                    )}
                                </div>

                                {permissionsReady ? (
                                    <div>
                                        {groups.map((group) => (
                                            <PermissionGroup
                                                key={group.name}
                                                name={group.name}
                                                description={group.description}
                                                keys={group.keys}
                                                editable={editablePermissions}
                                                canEdit={canEditUser}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className='flex items-center justify-center py-16'>
                                        <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-brand' />
                                    </div>
                                )}
                            </section>

                            {canEditUser && (
                                <div className='flex justify-end gap-3'>
                                    <Button variant='ghost' type='button' onClick={onCancel}>
                                        {t('common.cancel')}
                                    </Button>
                                    <Button
                                        variant='secondary'
                                        type='submit'
                                        disabled={isSubmitting || !permissionsReady}
                                    >
                                        {subuser ? t('common.save') : t('server.users.invite')}
                                    </Button>
                                </div>
                            )}
                        </Form>
                    );
                }}
            </Formik>
        </>
    );
};

export default UserFormComponent;
