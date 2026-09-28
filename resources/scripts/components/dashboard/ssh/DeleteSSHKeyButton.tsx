import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { deleteSSHKey, useSSHKeys } from '@/api/account/ssh-keys';
import Code from '@/components/elements/Code';
import { Dialog } from '@/components/elements/dialog';
import { useTranslation } from '@/i18n/I18nProvider';

import { useFlashKey } from '@/plugins/useFlash';

const DeleteSSHKeyButton = ({ name, fingerprint }: { name: string; fingerprint: string }) => {
    const { t } = useTranslation();
    const { clearAndAddHttpError } = useFlashKey('ssh-keys');
    const [visible, setVisible] = useState(false);
    const { mutate } = useSSHKeys();

    const onClick = () => {
        clearAndAddHttpError();

        Promise.all([
            mutate((data) => data?.filter((value) => value.fingerprint !== fingerprint), false),
            deleteSSHKey(fingerprint),
        ]).catch((error) => {
            mutate(undefined, true).catch(console.error);
            clearAndAddHttpError(error);
        });
    };

    return (
        <>
            <Dialog.Confirm
                open={visible}
                title={t('account.ssh.delete_title')}
                confirm={t('account.ssh.delete_confirm')}
                onConfirmed={onClick}
                onClose={() => setVisible(false)}
            >
                {t('account.ssh.delete_message_prefix')} <Code>{name}</Code> {t('account.ssh.delete_message_suffix')}
            </Dialog.Confirm>
            <button
                type='button'
                className='p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-150'
                onClick={() => setVisible(true)}
            >
                <FontAwesomeIcon icon={faTrashAlt} size='lg' />
            </button>
        </>
    );
};

export default DeleteSSHKeyButton;
