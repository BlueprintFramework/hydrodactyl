import { AntennaSignal, Calendar, Copy, Database, FolderOpen, Gear, Person, Server, Shield } from '@gravity-ui/icons';
import { type Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik } from 'formik';
import { useEffect } from 'react';
import { array, object, string } from 'yup';
import createOrUpdateSubuser from '@/api/server/users/createOrUpdateSubuser';
import Can from '@/components/elements/Can';
import Field from '@/components/elements/Field';
import FlashMessageRender from '@/components/FlashMessageRender';
import PermissionRow from '@/components/server/users/PermissionRow';
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
}

const ICON_MAP: Record<string, typeof Shield> = {
    control: Server,
    user: Person,
    file: FolderOpen,
    backup: Copy,
    allocation: AntennaSignal,
    startup: Gear,
    database: Database,
    schedule: Calendar,
};

const PermissionIcon = ({ name }: { name: string }) => {
    const Icon = ICON_MAP[name] ?? Shield;
    return <Icon width={22} height={22} fill='currentColor' className='text-brand flex-shrink-0 mt-0.5' />;
};

const CATEGORY_KEYS: Record<string, { description: TranslationKey; title: TranslationKey }> = {
    activity: {
        description: 'server.users.permissions.activity.description',
        title: 'server.users.permissions.activity.title',
    },
    allocation: {
        description: 'server.users.permissions.allocation.description',
        title: 'server.users.permissions.allocation.title',
    },
    backup: {
        description: 'server.users.permissions.backup.description',
        title: 'server.users.permissions.backup.title',
    },
    control: {
        description: 'server.users.permissions.control.description',
        title: 'server.users.permissions.control.title',
    },
    database: {
        description: 'server.users.permissions.database.description',
        title: 'server.users.permissions.database.title',
    },
    file: {
        description: 'server.users.permissions.file.description',
        title: 'server.users.permissions.file.title',
    },
    mod: {
        description: 'server.users.permissions.mod.description',
        title: 'server.users.permissions.mod.title',
    },
    schedule: {
        description: 'server.users.permissions.schedule.description',
        title: 'server.users.permissions.schedule.title',
    },
    settings: {
        description: 'server.users.permissions.settings.description',
        title: 'server.users.permissions.settings.title',
    },
    startup: {
        description: 'server.users.permissions.startup.description',
        title: 'server.users.permissions.startup.title',
    },
    user: {
        description: 'server.users.permissions.user.description',
        title: 'server.users.permissions.user.title',
    },
    websocket: {
        description: 'server.users.permissions.websocket.description',
        title: 'server.users.permissions.websocket.title',
    },
};

const UserFormComponent = ({ subuser, onSuccess, onCancel, flashKey, isSubmitting, setIsSubmitting }: Props) => {
    const { t } = useTranslation();
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const appendSubuser = ServerContext.useStoreActions((actions) => actions.subusers.appendSubuser);
    const { clearFlashes, clearAndAddHttpError } = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.flashes,
    );
    const getPermissions = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.permissions.getPermissions,
    );

    const isRootAdmin = useStoreState((state) => state.user.data?.rootAdmin);
    const permissions = useStoreState((state) => state.permissions.data);
    const loggedInPermissions = ServerContext.useStoreState((state) => state.server.permissions);
    const [canEditUser] = usePermissions(subuser ? ['user.update'] : ['user.create']);

    const editablePermissions = useDeepCompareMemo(() => {
        const list = Object.keys(permissions).flatMap((key) =>
            Object.keys(permissions[key]?.keys ?? {}).map((pkey) => `${key}.${pkey}`),
        );
        if (isRootAdmin || (loggedInPermissions.length === 1 && loggedInPermissions[0] === '*')) {
            return list;
        }
        return list.filter((key) => loggedInPermissions.indexOf(key) >= 0);
    }, [isRootAdmin, permissions, loggedInPermissions]);

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

    useEffect(() => {
        getPermissions().catch((error) => {
            console.error(error);
            clearAndAddHttpError({ key: flashKey, error });
        });
    }, [getPermissions, clearAndAddHttpError, flashKey]);

    useEffect(
        () => () => {
            clearFlashes(flashKey);
        },
        [flashKey, clearFlashes],
    );

    const getCategoryKeys = (key: string) => Object.keys(permissions[key]?.keys ?? {});
    const getCategoryPermissions = (key: string) => getCategoryKeys(key).map((pkey) => `${key}.${pkey}`);

    const toggleAll = (values: Values, setFieldValue: (field: string, value: unknown) => void) => {
        const allPermissions = editablePermissions;
        const allSelected = allPermissions.every((p) => values.permissions.includes(p));
        setFieldValue('permissions', allSelected ? [] : [...allPermissions]);
    };

    const toggleCategory = (key: string, values: Values, setFieldValue: (field: string, value: unknown) => void) => {
        const categoryPermissions = getCategoryPermissions(key);
        const allSelected = categoryPermissions.every((p) => values.permissions.includes(p));
        if (allSelected) {
            setFieldValue(
                'permissions',
                values.permissions.filter((p) => !categoryPermissions.includes(p)),
            );
        } else {
            const newPermissions = [...values.permissions];
            categoryPermissions.forEach((p) => {
                if (!newPermissions.includes(p) && editablePermissions.includes(p)) {
                    newPermissions.push(p);
                }
            });
            setFieldValue('permissions', newPermissions);
        }
    };

    return (
        <>
            <FlashMessageRender byKey={flashKey} />

            <Formik
                onSubmit={submit}
                initialValues={
                    {
                        email: subuser?.email || '',
                        permissions: subuser?.permissions || [],
                    } as Values
                }
                validationSchema={object().shape({
                    email: string()
                        .max(191, t('server.users.email_max'))
                        .email(t('server.users.email_invalid'))
                        .required(t('server.users.email_invalid')),
                    permissions: array().of(string()),
                })}
            >
                {({ setFieldValue, values }) => {
                    const allSelected = editablePermissions.every((p) => values.permissions.includes(p));
                    const isCategoryAllSelected = (key: string) =>
                        getCategoryPermissions(key).every((p) => values.permissions.includes(p));
                    return (
                        <Form className='space-y-6'>
                            {!subuser && (
                                <div className='rounded-xl p-6'>
                                    <div className='flex items-center gap-3 mb-6'>
                                        <div className='w-10 h-10 rounded-lg bg-mocha-400 flex items-center justify-center'>
                                            <Person
                                                width={22}
                                                height={22}
                                                fill='currentColor'
                                                className='w-5 h-5 text-brand'
                                            />
                                        </div>
                                        <h3 className='text-xl font-semibold text-zinc-100'>
                                            {t('server.users.user_information')}
                                        </h3>
                                    </div>
                                    <Field
                                        name='email'
                                        label={t('server.users.email_label')}
                                        description={t('server.users.email_description')}
                                    />
                                </div>
                            )}

                            <div className='rounded-xl p-6'>
                                <div className='flex items-center justify-between mb-6'>
                                    <div className='flex items-center gap-3'>
                                        <div className='w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center'>
                                            <Gear
                                                width={22}
                                                height={22}
                                                fill='currentColor'
                                                className='w-5 h-5 text-brand'
                                            />
                                        </div>
                                        <h3 className='text-xl font-semibold text-zinc-100'>
                                            {t('server.users.detailed_permissions')}
                                        </h3>
                                    </div>
                                    {canEditUser && (
                                        <Button
                                            variant='secondary'
                                            size='sm'
                                            type='button'
                                            onClick={() => toggleAll(values, setFieldValue)}
                                        >
                                            {allSelected
                                                ? t('server.users.deselect_all')
                                                : t('server.users.select_all')}
                                        </Button>
                                    )}
                                </div>

                                {!isRootAdmin && loggedInPermissions[0] !== '*' && (
                                    <div className='mb-6 p-4 bg-brand/10 border border-brand/20 rounded-lg'>
                                        <div className='flex items-center gap-3 mb-2'>
                                            <Shield
                                                width={22}
                                                height={22}
                                                fill='currentColor'
                                                className='w-5 h-5 text-brand'
                                            />
                                            <span className='text-sm font-semibold text-brand'>
                                                {t('server.users.permission_restriction_title')}
                                            </span>
                                        </div>
                                        <p className='text-sm text-zinc-300 leading-relaxed'>
                                            {t('server.users.permission_restriction_description')}
                                        </p>
                                    </div>
                                )}

                                <div className='space-y-4'>
                                    {Object.keys(permissions)
                                        .filter((key) => key !== 'websocket')
                                        .map((key) => {
                                            const category = CATEGORY_KEYS[key];

                                            return (
                                                <div key={key} className='border border-[#ffffff12] rounded-lg p-4'>
                                                    <div className='flex items-start justify-between mb-3'>
                                                        <div className='flex items-start gap-3 flex-1 min-w-0'>
                                                            <PermissionIcon name={key} />
                                                            <div className='flex-1 min-w-0'>
                                                                <h4 className='font-medium text-zinc-200'>
                                                                    {category ? t(category.title) : key}
                                                                </h4>
                                                                <p className='text-xs text-zinc-400 mt-1 break-words'>
                                                                    {category
                                                                        ? t(category.description)
                                                                        : permissions[key]?.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {canEditUser && (
                                                            <Button
                                                                variant='secondary'
                                                                size='sm'
                                                                type='button'
                                                                onClick={() =>
                                                                    toggleCategory(key, values, setFieldValue)
                                                                }
                                                            >
                                                                {isCategoryAllSelected(key)
                                                                    ? t('server.users.deselect_all')
                                                                    : t('server.users.select_all')}
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                                        {getCategoryKeys(key).map((pkey) => (
                                                            <PermissionRow
                                                                key={`permission_${key}.${pkey}`}
                                                                permission={`${key}.${pkey}`}
                                                                disabled={
                                                                    !canEditUser ||
                                                                    !editablePermissions.includes(`${key}.${pkey}`)
                                                                }
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            <Can action={subuser ? 'user.update' : 'user.create'}>
                                <div className='flex gap-3 justify-end pt-4 border-t border-[#ffffff12]'>
                                    <Button variant='secondary' type='button' onClick={onCancel}>
                                        {t('common.cancel')}
                                    </Button>
                                    <Button variant='attention' type='submit' disabled={isSubmitting}>
                                        {subuser ? t('server.users.save_changes') : t('server.users.invite_user')}
                                    </Button>
                                </div>
                            </Can>
                        </Form>
                    );
                }}
            </Formik>
        </>
    );
};

export default UserFormComponent;
