import { Alert } from '@/components/elements/alert';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Dialog, type DialogProps } from '@/components/elements/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';

interface RecoveryTokenDialogProps extends DialogProps {
    tokens: string[];
}

const RecoveryTokensDialog = ({ tokens, open, onClose }: RecoveryTokenDialogProps) => {
    const { t } = useTranslation();
    const grouped = [] as [string, string][];
    tokens.forEach((token, index) => {
        if (index % 2 === 0) {
            grouped.push([token, tokens[index + 1] || '']);
        }
    });

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={t('account.two_factor.recovery_title')}
            description={t('account.two_factor.recovery_description')}
            hideCloseIcon
            preventExternalClose
        >
            <Dialog.Icon position={'container'} type={'success'} />
            <CopyOnClick text={tokens.join('\n')} showInNotification={false}>
                <pre className={'bg-zinc-800 rounded-sm p-2 mt-6'}>
                    {grouped.map((value) => (
                        <span key={value.join('_')} className={'block'}>
                            {value[0]}
                            <span className={'mx-2 selection:bg-zinc-800'}>&nbsp;</span>
                            {value[1]}
                            <span className={'selection:bg-zinc-800'}>&nbsp;</span>
                        </span>
                    ))}
                </pre>
            </CopyOnClick>
            <Alert type={'danger'} className={'mt-3'}>
                {t('account.two_factor.recovery_notice')}
            </Alert>
            <Dialog.Footer>
                <Button onClick={onClose}>{t('common.done')}</Button>
            </Dialog.Footer>
        </Dialog>
    );
};

export default RecoveryTokensDialog;
