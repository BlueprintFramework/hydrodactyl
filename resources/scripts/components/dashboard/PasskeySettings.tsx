import { TrashBin } from '@gravity-ui/icons';
import { usePasskeyRegister } from '@laravel/passkeys/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import http, { httpErrorToHuman } from '@/api/http';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useTranslation } from '@/i18n/I18nProvider';
import { formatDateTime } from '@/lib/formatters';
import { isPasswordConfirmationError, passkeyAuthenticatorLabel, passkeyErrorMessage } from '@/lib/passkeys';
import { useFlashKey } from '@/plugins/useFlash';
import PasskeyPasswordModal from './PasskeyPasswordModal';

interface Passkey {
    id: number;
    name: string;
    authenticator: string | null;
    authenticator_icon_light: string | null;
    authenticator_icon_dark: string | null;
    created_at: string | null;
    last_used_at: string | null;
}

type PendingAction = { type: 'add'; name: string } | { type: 'delete'; passkey: Passkey };

// Million compiles this into a block, which binds the input's onChange as the
// native `change` event (fires on blur/Enter) instead of React's synthetic one.
// million-ignore
const PasskeySettings = () => {
    const { t, locale } = useTranslation();
    const { theme } = useAppearance();
    const { clearAndAddHttpError } = useFlashKey('account:passkeys');
    const [passkeys, setPasskeys] = useState<Passkey[]>([]);
    const [maxPasskeys, setMaxPasskeys] = useState(10);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [passkeyToDelete, setPasskeyToDelete] = useState<Passkey | null>(null);
    const [passwordConfirmed, setPasswordConfirmed] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [confirmingPassword, setConfirmingPassword] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const pendingName = useRef('');
    const atLimit = maxPasskeys > 0 && passkeys.length >= maxPasskeys;

    const loadPasskeys = useCallback(() => {
        setLoading(true);
        http.get('/user/passkeys')
            .then(({ data }) => {
                setPasskeys(data.passkeys ?? []);

                if (typeof data.max === 'number') {
                    setMaxPasskeys(data.max);
                }
            })
            .catch((error) => clearAndAddHttpError(new Error(httpErrorToHuman(error))))
            .finally(() => setLoading(false));
    }, [clearAndAddHttpError]);

    useEffect(() => {
        loadPasskeys();
    }, [loadPasskeys]);

    useEffect(() => {
        http.get('/user/passkeys/confirmation')
            .then(({ data }) => setPasswordConfirmed(data.confirmed === true))
            .catch(() => setPasswordConfirmed(false));
    }, []);

    const requestPassword = (action: PendingAction) => {
        setPendingAction(action);
        setPasswordError(null);
        setPasswordModalOpen(true);
    };

    const { register, isLoading, isSupported } = usePasskeyRegister({
        onSuccess: () => {
            pendingName.current = '';
            setName('');
            loadPasskeys();
        },
        onError: (error) => {
            if (isPasswordConfirmationError(error)) {
                setPasswordConfirmed(false);
                requestPassword({ type: 'add', name: pendingName.current });
                return;
            }

            clearAndAddHttpError(new Error(passkeyErrorMessage(error, t)));
        },
    });

    const performAdd = async (passkeyName: string) => {
        pendingName.current = passkeyName;

        try {
            await http.get('/sanctum/csrf-cookie');
            await register(passkeyName);
        } catch (error) {
            if (isPasswordConfirmationError(error)) {
                setPasswordConfirmed(false);
                requestPassword({ type: 'add', name: passkeyName });
                return;
            }

            clearAndAddHttpError(new Error(passkeyErrorMessage(error, t)));
        }
    };

    const addPasskey = async () => {
        const trimmed = name.trim();

        if (!trimmed) {
            return;
        }

        if (atLimit) {
            clearAndAddHttpError(new Error(t('account.passkeys.limit_reached', { max: maxPasskeys })));
            return;
        }

        if (passkeys.some((passkey) => passkey.name.trim().toLocaleLowerCase() === trimmed.toLocaleLowerCase())) {
            clearAndAddHttpError(new Error(t('account.passkeys.name_taken')));
            return;
        }

        if (!passwordConfirmed) {
            requestPassword({ type: 'add', name: trimmed });
            return;
        }

        await performAdd(trimmed);
    };

    const deletePasskey = (passkey: Passkey) => {
        setDeleting(passkey.id);
        http.delete(`/user/passkeys/${passkey.id}`)
            .then(() => setPasskeys((current) => current.filter((entry) => entry.id !== passkey.id)))
            .catch((error) => {
                if (isPasswordConfirmationError(error)) {
                    setPasswordConfirmed(false);
                    setPasskeyToDelete(null);
                    requestPassword({ type: 'delete', passkey });
                    return;
                }

                clearAndAddHttpError(new Error(httpErrorToHuman(error)));
            })
            .finally(() => {
                setDeleting(null);
                setPasskeyToDelete(null);
            });
    };

    const requestDelete = (passkey: Passkey) => {
        if (!passwordConfirmed) {
            requestPassword({ type: 'delete', passkey });
            return;
        }

        setPasskeyToDelete(passkey);
    };

    const confirmPassword = async (password: string) => {
        setConfirmingPassword(true);
        setPasswordError(null);

        try {
            await http.post('/user/passkeys/confirm-password', { password });
            setPasswordConfirmed(true);
            setPasswordModalOpen(false);

            const action = pendingAction;
            setPendingAction(null);

            if (action?.type === 'add') {
                await performAdd(action.name);
            } else if (action?.type === 'delete') {
                setPasskeyToDelete(action.passkey);
            }
        } catch (error) {
            setPasswordError(httpErrorToHuman(error));
        } finally {
            setConfirmingPassword(false);
        }
    };

    const closePasswordModal = () => {
        if (confirmingPassword) {
            return;
        }

        setPasswordModalOpen(false);
        setPendingAction(null);
        setPasswordError(null);
    };

    if (!isSupported) {
        return <p className='text-sm text-zinc-400'>{t('account.passkeys.unsupported')}</p>;
    }

    return (
        <div className='flex flex-col gap-5'>
            <PasskeyPasswordModal
                open={passwordModalOpen}
                loading={confirmingPassword}
                error={passwordError}
                onClose={closePasswordModal}
                onConfirmed={(password) => void confirmPassword(password)}
            />

            <Dialog.Confirm
                open={passkeyToDelete !== null}
                onClose={() => {
                    if (deleting === null) {
                        setPasskeyToDelete(null);
                    }
                }}
                title={t('account.passkeys.delete_title')}
                confirm={t('account.passkeys.delete')}
                loading={deleting !== null}
                preventExternalClose={deleting !== null}
                onConfirmed={() => {
                    if (passkeyToDelete) {
                        void deletePasskey(passkeyToDelete);
                    }
                }}
            >
                {t('account.passkeys.delete_confirm', { name: passkeyToDelete?.name ?? '' })}
            </Dialog.Confirm>

            <div className='flex flex-wrap items-center justify-between gap-2'>
                <p className='text-sm text-zinc-300'>{t('account.passkeys.description')}</p>
                {maxPasskeys > 0 && (
                    <span className='text-xs text-zinc-400'>
                        {t('account.passkeys.count', { count: passkeys.length, max: maxPasskeys })}
                    </span>
                )}
            </div>

            <form
                autoComplete='off'
                className='flex flex-col gap-3 sm:flex-row'
                onSubmit={(event) => {
                    event.preventDefault();
                    void addPasskey();
                }}
            >
                <input
                    type='text'
                    name='passkey-name'
                    autoComplete='off'
                    data-1p-ignore
                    data-lpignore='true'
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t('account.passkeys.name_placeholder')}
                    maxLength={100}
                    className='min-w-0 flex-1 rounded-lg border border-mocha-400 bg-mocha-400 px-3 py-2 text-sm text-zinc-100 outline-hidden focus:border-hydro-400'
                />
                <Button type='submit' variant='secondary' disabled={isLoading || !name.trim() || atLimit}>
                    {t('account.passkeys.create')}
                </Button>
            </form>

            {atLimit && (
                <p className='text-sm text-amber-400'>{t('account.passkeys.limit_reached', { max: maxPasskeys })}</p>
            )}

            {loading ? (
                <p className='text-sm text-zinc-400'>{t('common.loading')}</p>
            ) : passkeys.length === 0 ? (
                <p className='text-sm text-zinc-400'>{t('account.passkeys.empty')}</p>
            ) : (
                <div className='space-y-3'>
                    {passkeys.map((passkey) => {
                        const icon =
                            theme === 'dark' ? passkey.authenticator_icon_dark : passkey.authenticator_icon_light;
                        const created = passkey.created_at
                            ? t('account.passkeys.created', {
                                  date: formatDateTime(new Date(passkey.created_at), locale, 'medium'),
                              })
                            : null;
                        const authenticator = passkeyAuthenticatorLabel(passkey.authenticator, t);

                        return (
                            <div
                                key={passkey.id}
                                className='flex items-center justify-between gap-4 rounded-lg border border-mocha-400 px-4 py-3'
                            >
                                <div className='flex min-w-0 items-center gap-3'>
                                    {icon && (
                                        <img src={icon} alt='' className='h-6 w-6 shrink-0 rounded-md object-contain' />
                                    )}
                                    <div className='min-w-0'>
                                        <p className='truncate text-sm font-medium text-zinc-100'>{passkey.name}</p>
                                        {authenticator && (
                                            <p className='truncate text-xs text-zinc-400'>{authenticator}</p>
                                        )}
                                        <p className='text-xs text-zinc-400'>
                                            {created ? `${created} · ` : ''}
                                            {t('account.passkeys.last_used')}:{' '}
                                            {passkey.last_used_at
                                                ? formatDateTime(new Date(passkey.last_used_at), locale, 'medium')
                                                : t('account.passkeys.never_used')}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type='button'
                                    variant='attention'
                                    size='sm'
                                    disabled={deleting !== null}
                                    onClick={() => requestDelete(passkey)}
                                    title={t('account.passkeys.delete')}
                                    aria-label={t('account.passkeys.delete')}
                                >
                                    <TrashBin width={18} height={18} fill='currentColor' />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}

            <p className='text-xs text-zinc-500'>{t('account.passkeys.help')}</p>
            <p className='text-xs text-zinc-500'>{t('account.passkeys.recommendation')}</p>
        </div>
    );
};

export default PasskeySettings;
