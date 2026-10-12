import { TriangleExclamation } from '@gravity-ui/icons';
import ConfirmationModal from '@/components/elements/ConfirmationModal';

interface Props {
    visible: boolean;
    wipeCountdown: number;
    shiftPressed: boolean;
    wipeLoading: boolean;
    onConfirm: () => void;
    onDismiss: () => void;
}

const WipeConfirmationModal = ({ visible, wipeCountdown, shiftPressed, wipeLoading, onConfirm, onDismiss }: Props) => (
    <ConfirmationModal
        title='Wipe All Files Without Backup?'
        buttonText={wipeCountdown > 0 ? `Yes, Wipe Files (${wipeCountdown}s)` : 'Yes, Wipe Files'}
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
                    <h4 className='text-red-400 font-semibold mb-2'>DANGER: No Backup Selected</h4>
                    <p className='text-sm text-cream-400'>
                        You have chosen to wipe all files <strong>without creating a backup</strong>. This action will{' '}
                        <strong>permanently delete ALL files</strong> on your server and cannot be undone.
                    </p>
                </div>
            </div>
            <div className='text-sm text-cream-400 space-y-2'>
                <p>
                    <strong>What will happen:</strong>
                </p>
                <ul className='list-disc list-inside space-y-1 ml-4'>
                    <li>All server files will be permanently deleted</li>
                    <li>Your server will be stopped and reinstalled</li>
                    <li>Any custom configurations or data will be lost</li>
                    <li>This action cannot be reversed</li>
                </ul>
            </div>
            <p className='text-sm text-cream-400'>Are you absolutely sure you want to proceed without a backup?</p>
        </div>
    </ConfirmationModal>
);

export default WipeConfirmationModal;
