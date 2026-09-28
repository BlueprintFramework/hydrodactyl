// FIXME: replace with radix tooltip
// import Tooltip from '@/components/elements/tooltip/Tooltip';
import { useContext, useEffect, useMemo, useState } from 'react';
import disableAccountTwoFactor from '@/api/account/disableAccountTwoFactor';
import { Dialog, type DialogProps, DialogWrapperContext } from '@/components/elements/dialog';
import { Input } from '@/components/elements/inputs';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import asDialog from '@/hoc/asDialog';
import { useTranslation } from '@/i18n/I18nProvider';
import { useFlashKey } from '@/plugins/useFlash';
import { useStoreActions } from '@/state/hooks';

const DisableTOTPDialogContent = () => {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [password, setPassword] = useState('');
    const { clearAndAddHttpError } = useFlashKey('account:two-step');
    const { close, setProps } = useContext(DialogWrapperContext);
    const updateUserData = useStoreActions((actions) => actions.user.updateUserData);

    useEffect(() => {
        setProps((state) => ({ ...state, preventExternalClose: submitting }));
    }, [submitting, setProps]);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (submitting) return;

        setSubmitting(true);
        clearAndAddHttpError();
        disableAccountTwoFactor(password)
            .then(() => {
                updateUserData({ useTotp: false });
                close();
            })
            .catch(clearAndAddHttpError)
            .then(() => setSubmitting(false));
    };

    return (
        <form id={'disable-totp-form'} className={'mt-6'} onSubmit={submit}>
            <FlashMessageRender byKey={'account:two-step'} />
            <label className={'block pb-1'} htmlFor={'totp-password'}>
                {t('account.two_factor.password_label')}
            </label>
            <Input.Text
                id={'totp-password'}
                type={'password'}
                variant={Input.Text.Variants.Loose}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <Dialog.Footer>
                <Button variant='secondary' onClick={close}>
                    {t('common.cancel')}
                </Button>
                {/* <Tooltip
          delay={100}
          disabled={password.length > 0}
          content={'You must enter your account password to continue.'}
        > */}
                <Button
                    variant='destructive'
                    type={'submit'}
                    form={'disable-totp-form'}
                    disabled={submitting || !password.length}
                >
                    {t('common.disable')}
                </Button>
                {/* </Tooltip> */}
            </Dialog.Footer>
        </form>
    );
};

const DisableTOTPDialog = ({ open, onClose }: DialogProps) => {
    const { t } = useTranslation();
    const DialogComponent = useMemo(
        () =>
            asDialog({
                title: t('account.two_factor.remove'),
                description: t('account.two_factor.remove_description'),
            })(DisableTOTPDialogContent),
        [t],
    );

    return <DialogComponent open={open} onClose={onClose} />;
};

export default DisableTOTPDialog;
