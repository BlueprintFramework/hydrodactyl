import { TriangleExclamation } from '@gravity-ui/icons';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import { useTranslation } from '@/i18n/I18nProvider';

interface Props {
    visible: boolean;
    wipeCountdown: number;
    shiftPressed: boolean;
    wipeLoading: boolean;
    onConfirm: () => void;
    onDismiss: () => void;
}

const WipeConfirmationModal = ({ visible, wipeCountdown, shiftPressed, wipeLoading, onConfirm, onDismiss }: Props) => {
    const { t } = useTranslation();

    return (
        <ConfirmationModal
            title={t('server.software.wipe.title')}
            buttonText={
                wipeCountdown > 0
                    ? t('server.software.wipe.button_countdown', { countdown: wipeCountdown })
                    : t('server.software.wipe.button')
            }
            visible={visible}
            onConfirmed={onConfirm}
            onModalDismissed={onDismiss}
            disabled={wipeCountdown > 0 && !shiftPressed}
            loading={wipeLoading}
        >
            <div className='space-y-4'>
                <div className='flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg'>
                    <TriangleExclamation
                        width={22}
                        height={22}
                        fill='currentColor'
                        className='w-5 h-5 text-red-400 flex-shrink-0 mt-0.5'
                    />
                    <div>
                        <h4 className='text-red-400 font-semibold mb-2'>{t('server.software.wipe.danger_title')}</h4>
                        <p className='text-sm text-neutral-300'>
                            {t('server.software.wipe.warning_prefix')}{' '}
                            <strong>{t('server.software.wipe.warning_no_backup')}</strong>
                            {t('server.software.wipe.warning_middle')}{' '}
                            <strong>{t('server.software.wipe.warning_delete_all')}</strong>{' '}
                            {t('server.software.wipe.warning_suffix')}
                        </p>
                    </div>
                </div>
                <div className='text-sm text-neutral-300 space-y-2'>
                    <p>
                        <strong>{t('server.software.wipe.what_will_happen')}</strong>
                    </p>
                    <ul className='list-disc list-inside space-y-1 ml-4'>
                        <li>{t('server.software.wipe.item_files_deleted')}</li>
                        <li>{t('server.software.wipe.item_reinstall')}</li>
                        <li>{t('server.software.wipe.item_configs_lost')}</li>
                        <li>{t('server.software.wipe.item_unreversible')}</li>
                    </ul>
                </div>
                <p className='text-sm text-neutral-300'>{t('server.software.wipe.confirm_question')}</p>
            </div>
        </ConfirmationModal>
    );
};

export default WipeConfirmationModal;
