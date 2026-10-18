import { useContext } from 'react';
import { Button } from '@/components/ui/button';
import ModalContext from '@/context/ModalContext';
import asModal from '@/hoc/asModal';
import { useTranslation } from '@/i18n/I18nProvider';

type Props = {
    title: string;
    buttonText: string;
    onConfirmed: () => void;
    showSpinnerOverlay?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
};

const ConfirmationModal: React.FC<Props> = ({ children, buttonText, onConfirmed, disabled }) => {
    const { dismiss } = useContext(ModalContext);
    const { t } = useTranslation();

    return (
        <div className='flex flex-col w-full'>
            <div className={`text-zinc-300`}>{children}</div>
            <div className={`flex gap-4 items-center justify-end my-6`}>
                <Button variant='secondary' onClick={() => dismiss()}>
                    {t('common.cancel')}
                </Button>
                <Button variant='attention' onClick={() => onConfirmed()} disabled={disabled}>
                    {buttonText}
                </Button>
            </div>
        </div>
    );
};

ConfirmationModal.displayName = 'ConfirmationModal';

export default asModal<Props>((props) => ({
    title: props.title,
    showSpinnerOverlay: props.showSpinnerOverlay,
}))(ConfirmationModal);
