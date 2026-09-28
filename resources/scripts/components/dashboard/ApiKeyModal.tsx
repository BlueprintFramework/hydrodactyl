import { useContext, useMemo } from 'react';
import CopyOnClick from '@/components/elements/CopyOnClick';

import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import ModalContext from '@/context/ModalContext';
import asModal, { type AsModalProps } from '@/hoc/asModal';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
    apiKey: string;
}

const ApiKeyModalContent = ({ apiKey }: Props) => {
    const { t } = useTranslation();
    const { dismiss } = useContext(ModalContext);

    return (
        <div className='p-6 space-y-6 max-w-lg mx-auto rounded-lg shadow-lg'>
            {/* Flash message section */}
            <FlashMessageRender byKey='account' />

            {/* Modal Header */}
            <p className='text-sm text-white-600 mt-2'>{t('account.api_keys.modal_description')}</p>

            {/* API Key Display Section */}
            <div className='relative mt-6'>
                <pre className='bg-gray-900 text-white p-4 rounded-lg font-mono overflow-x-auto'>
                    <CopyOnClick text={apiKey}>
                        <code className='text-sm break-words'>{apiKey}</code>
                    </CopyOnClick>

                    {/* Copy button with icon */}
                    <div className='absolute top-2 right-2'></div>
                </pre>
            </div>

            {/* Action Buttons */}
            <div className='flex justify-end space-x-4'>
                <Button variant='destructive' onClick={() => dismiss()}>
                    {t('common.close')}
                </Button>
            </div>
        </div>
    );
};

const ApiKeyModal = ({ apiKey, ...modalProps }: Props & AsModalProps) => {
    const { t } = useTranslation();
    const ModalComponent = useMemo(
        () =>
            asModal<Props>({
                title: t('account.api_keys.modal_title'),
                closeOnEscape: true, // Allows closing the modal by pressing Escape
                closeOnBackground: true, // Allows closing by clicking outside the modal
            })(ApiKeyModalContent),
        [t],
    );

    return <ModalComponent apiKey={apiKey} {...modalProps} />;
};

ApiKeyModal.displayName = 'ApiKeyModal';

export default ApiKeyModal;
