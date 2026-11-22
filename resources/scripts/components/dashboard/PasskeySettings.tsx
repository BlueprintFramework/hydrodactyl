import { TrashBin } from '@gravity-ui/icons';
import { usePasskeyRegister } from '@laravel/passkeys/react';
import { useCallback, useEffect, useState } from 'react';
import http, { httpErrorToHuman } from '@/api/http';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { formatDateTime } from '@/lib/formatters';
import { passkeyErrorMessage } from '@/lib/passkeys';
import { useFlashKey } from '@/plugins/useFlash';

interface Passkey {
    id: number;
    name: string;
    authenticator: string | null;
    created_at: string | null;
    last_used_at: string | null;
}

// Million compiles this into a block, which binds the input's onChange as the
// native `change` event (fires on blur/Enter) instead of React's synthetic one.
// million-ignore
const PasskeySettings = () => {
    const { t, locale } = useTranslation();
    const { clearAndAddHttpError } = useFlashKey('account:passkeys');
    const [passkeys, setPasskeys] = useState<Passkey[]>([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [passkeyToDelete, setPasskeyToDelete] = useState<Passkey | null>(null);

    const loadPasskeys = useCallback(() => {
        setLoading(true);
        http.get('/user/passkeys')
            .then(({ data }) => setPasskeys(data.passkeys ?? []))
            .catch((error) => clearAndAddHttpError(new Error(httpErrorToHuman(error))))
            .finally(() => setLoading(false));
    }, [clearAndAddHttpError]);

    useEffect(() => {
        loadPasskeys();
    }, [loadPasskeys]);

    const { register, isLoading, isSupported } = usePasskeyRegister({
        onSuccess: () => {
            setName('');
            loadPasskeys();
        },
        onError: (error) => {
            clearAndAddHttpError(new Error(passkeyErrorMessage(error, t)));
        },
    });

    const addPasskey = async () => {
        if (!name.trim()) {
            return;
        }

        try {
            await http.get('/sanctum/csrf-cookie');
            await register(name.trim());
        } catch (error) {
            clearAndAddHttpError(new Error(httpErrorToHuman(error)));
        }
    };

    const deletePasskey = (passkey: Passkey) => {
        setDeleting(passkey.id);
        http.delete(`/user/passkeys/${passkey.id}`)
            .then(() => setPasskeys((current) => current.filter((entry) => entry.id !== passkey.id)))
            .catch((error) => clearAndAddHttpError(new Error(httpErrorToHuman(error))))
            .finally(() => {
                setDeleting(null);
                setPasskeyToDelete(null);
            });
    };

    if (!isSupported) {
        return <p className='text-sm text-zinc-400'>{t('account.passkeys.unsupported')}</p>;
    }

    return (
        <div className='space-y-5'>
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

            <p className='text-sm text-zinc-300'>{t('account.passkeys.description')}</p>

            <div className='flex flex-col gap-3 sm:flex-row'>
                <input
                    type='text'
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t('account.passkeys.name_placeholder')}
                    maxLength={100}
                    className='min-w-0 flex-1 rounded-lg border border-mocha-400 bg-mocha-400 px-3 py-2 text-sm text-zinc-100 outline-hidden focus:border-hydro-400'
                />
                <Button type='button' variant='secondary' disabled={isLoading || !name.trim()} onClick={addPasskey}>
                    {t('account.passkeys.create')}
                </Button>
            </div>

            {loading ? (
                <p className='text-sm text-zinc-400'>{t('common.loading')}</p>
            ) : passkeys.length === 0 ? (
                <p className='text-sm text-zinc-400'>{t('account.passkeys.empty')}</p>
            ) : (
                <div className='space-y-3'>
                    {passkeys.map((passkey) => (
                        <div
                            key={passkey.id}
                            className='flex items-center justify-between gap-4 rounded-lg border border-mocha-400 px-4 py-3'
                        >
                            <div className='min-w-0'>
                                <p className='truncate text-sm font-medium text-zinc-100'>{passkey.name}</p>
                                <p className='text-xs text-zinc-400'>
                                    {passkey.authenticator ? `${passkey.authenticator} · ` : ''}
                                    {t('account.passkeys.last_used')}:{' '}
                                    {passkey.last_used_at
                                        ? formatDateTime(new Date(passkey.last_used_at), locale, 'medium')
                                        : t('account.passkeys.never_used')}
                                </p>
                            </div>
                            <Button
                                type='button'
                                variant='attention'
                                size='sm'
                                disabled={deleting !== null}
                                onClick={() => setPasskeyToDelete(passkey)}
                                title={t('account.passkeys.delete')}
                                aria-label={t('account.passkeys.delete')}
                            >
                                <TrashBin width={18} height={18} fill='currentColor' />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <p className='text-xs text-zinc-500'>{t('account.passkeys.help')}</p>
        </div>
    );
};

export default PasskeySettings;
