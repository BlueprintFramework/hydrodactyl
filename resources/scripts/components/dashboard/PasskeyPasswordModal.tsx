import { useEffect, useState } from 'react';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
    open: boolean;
    loading: boolean;
    error: string | null;
    onClose: () => void;
    onConfirmed: (password: string) => void;
}

const PasskeyPasswordModal = ({ open, loading, error, onClose, onConfirmed }: Props) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (!open) {
            setPassword('');
        }
    }, [open]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={t('account.passkeys.password_title')}
            preventExternalClose={loading}
        >
            <p className='text-sm text-zinc-300'>{t('account.passkeys.password_description')}</p>

            {error && (
                <p role='alert' className='mt-3 text-sm text-red-400'>
                    {error}
                </p>
            )}

            <div className='mt-4'>
                <label htmlFor='passkey-password' className='mb-1 block text-sm font-medium text-zinc-300'>
                    {t('account.passkeys.password_label')}
                </label>
                <input
                    id='passkey-password'
                    type='password'
                    autoComplete='current-password'
                    autoFocus
                    className='w-full rounded-lg border border-zinc-700 bg-[#ffffff17] px-4 py-2 text-sm outline-hidden focus:border-brand'
                    placeholder={t('account.passkeys.password_placeholder')}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                />
            </div>

            <Dialog.Footer>
                <Button variant='secondary' onClick={onClose} disabled={loading}>
                    {t('common.cancel')}
                </Button>
                <Button variant='attention' onClick={() => onConfirmed(password)} disabled={loading || !password}>
                    {loading && <Spinner size='small' />}
                    {t('common.confirm')}
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
};

export default PasskeyPasswordModal;
