// FIXME: replace with radix tooltip
// import Tooltip from '@/components/elements/tooltip/Tooltip';
import { type Actions, useStoreActions } from 'easy-peasy';
import { QRCodeSVG } from 'qrcode.react';
import { useContext, useEffect, useMemo, useState } from 'react';
import enableAccountTwoFactor from '@/api/account/enableAccountTwoFactor';
import getTwoFactorTokenData, { type TwoFactorTokenData } from '@/api/account/getTwoFactorTokenData';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Dialog, type DialogProps, DialogWrapperContext } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import Spinner from '@/components/elements/Spinner';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import asDialog from '@/hoc/asDialog';
import { useTranslation } from '@/i18n/I18nProvider';
import { useFlashKey } from '@/plugins/useFlash';
import type { ApplicationStore } from '@/state';

interface Props {
    onTokens: (tokens: string[]) => void;
}

const SetupTOTPDialogContent = ({ onTokens }: Props) => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [value, setValue] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState<TwoFactorTokenData | null>(null);
    const { clearAndAddHttpError } = useFlashKey('account:two-step');
    const updateUserData = useStoreActions((actions: Actions<ApplicationStore>) => actions.user.updateUserData);

    const { close, setProps } = useContext(DialogWrapperContext);

    useEffect(() => {
        getTwoFactorTokenData()
            .then(setToken)
            .catch((error) => clearAndAddHttpError(error));
    }, [clearAndAddHttpError]);

    useEffect(() => {
        setProps((state) => ({ ...state, preventExternalClose: submitting }));
    }, [submitting, setProps]);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (submitting) return;

        setSubmitting(true);
        clearAndAddHttpError();
        enableAccountTwoFactor(value, password)
            .then((tokens) => {
                updateUserData({ useTotp: true });
                onTokens(tokens);
            })
            .catch((error) => {
                clearAndAddHttpError(error);
                setSubmitting(false);
            });
    };

    return (
        <form id={'enable-totp-form'} onSubmit={submit}>
            <FlashMessageRender byKey={'account:two-step'} />
            <div className={'flex items-center justify-center w-56 h-56 p-2 bg-zinc-50 shadow-sm mx-auto mt-6'}>
                {!token ? (
                    <Spinner />
                ) : (
                    <QRCodeSVG value={token.image_url_data} className={`w-full h-full shadow-none`} />
                )}
            </div>
            <CopyOnClick text={token?.secret}>
                <p className={'font-mono text-sm text-zinc-100 text-center mt-2'}>
                    {token?.secret.match(/.{1,4}/g)?.join(' ') || t('common.loading')}
                </p>
            </CopyOnClick>
            <p id={'totp-code-description'} className={'mt-6'}>
                {t('account.two_factor.scan_description')}
            </p>
            <Input.Text
                aria-labelledby={'totp-code-description'}
                variant={Input.Text.Variants.Loose}
                value={value}
                onChange={(e) => setValue(e.currentTarget.value)}
                className={'mt-3'}
                placeholder={'000000'}
                type={'text'}
                inputMode={'numeric'}
                autoComplete={'one-time-code'}
                pattern={'\\d{6}'}
            />
            <label htmlFor={'totp-password'} className={'block mt-3'}>
                {t('account.two_factor.account_password_label')}
            </label>
            <Input.Text
                variant={Input.Text.Variants.Loose}
                className={'mt-1'}
                type={'password'}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <Dialog.Footer>
                <Button variant='secondary' onClick={close}>
                    {t('common.cancel')}
                </Button>
                {/* <Tooltip
          disabled={password.length > 0 && value.length === 6}
          content={
            !token
              ? 'Waiting for QR code to load...'
              : 'You must enter the 6-digit code and your password to continue.'
          }
          delay={100}
        > */}
                <Button
                    disabled={!token || value.length !== 6 || !password.length}
                    type={'submit'}
                    form={'enable-totp-form'}
                >
                    {t('common.enable')}
                </Button>
                {/* </Tooltip> */}
            </Dialog.Footer>
        </form>
    );
};

const SetupTOTPDialog = ({ open, onClose, onTokens }: Props & DialogProps) => {
    const { t } = useTranslation();
    const DialogComponent = useMemo(
        () =>
            asDialog({
                title: t('account.two_factor.enable'),
                description: t('account.two_factor.enable_description'),
            })(SetupTOTPDialogContent),
        [t],
    );

    return <DialogComponent open={open} onClose={onClose} onTokens={onTokens} />;
};

export default SetupTOTPDialog;
