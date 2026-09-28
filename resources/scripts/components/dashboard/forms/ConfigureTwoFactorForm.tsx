import { useStoreState } from 'easy-peasy';
import { useEffect, useState } from 'react';

import DisableTOTPDialog from '@/components/dashboard/forms/DisableTOTPDialog';
import RecoveryTokensDialog from '@/components/dashboard/forms/RecoveryTokensDialog';
import SetupTOTPDialog from '@/components/dashboard/forms/SetupTOTPDialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import useFlash from '@/plugins/useFlash';
import type { ApplicationStore } from '@/state';

const ConfigureTwoFactorForm = () => {
    const { t } = useTranslation();
    const [tokens, setTokens] = useState<string[]>([]);
    const [visible, setVisible] = useState<'enable' | 'disable' | null>(null);
    const isEnabled = useStoreState((state: ApplicationStore) => state.user.data?.useTotp);
    const { clearFlashes } = useFlash();

    useEffect(() => {
        return () => {
            clearFlashes('account:two-step');
        };
    }, [clearFlashes]);

    const onTokens = (tokens: string[]) => {
        setTokens(tokens);
        setVisible(null);
    };

    return (
        <div className='contents'>
            <SetupTOTPDialog open={visible === 'enable'} onClose={() => setVisible(null)} onTokens={onTokens} />
            <RecoveryTokensDialog tokens={tokens} open={tokens.length > 0} onClose={() => setTokens([])} />
            <DisableTOTPDialog open={visible === 'disable'} onClose={() => setVisible(null)} />
            <p className={`text-sm`}>
                {isEnabled
                    ? t('account.two_factor.enabled_description')
                    : t('account.two_factor.disabled_description')}
            </p>
            <div className={`mt-6`}>
                {isEnabled ? (
                    <Button variant='destructive' onClick={() => setVisible('disable')}>
                        {t('account.two_factor.remove')}
                    </Button>
                ) : (
                    <Button variant='secondary' onClick={() => setVisible('enable')}>
                        {t('account.two_factor.enable')}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ConfigureTwoFactorForm;
