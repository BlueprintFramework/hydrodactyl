import { useField } from 'formik';
import { memo, useCallback } from 'react';
import isEqual from 'react-fast-compare';

import Input from '@/components/elements/Input';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { useTranslation } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/types';

interface Props {
    isEditable?: boolean;
    title: TranslationKey;
    permissions: string[];
    className?: string;
    children: React.ReactNode;
}

const PermissionTitleBox: React.FC<Props> = memo(({ isEditable, title, permissions, className, children }) => {
    const { t } = useTranslation();
    const [{ value }, , { setValue }] = useField<string[]>('permissions');

    const onCheckboxClicked = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.currentTarget.checked) {
                setValue([...value, ...permissions.filter((p) => !value.includes(p))]);
            } else {
                setValue(value.filter((p) => !permissions.includes(p)));
            }
        },
        [permissions, value, setValue],
    );

    return (
        <TitledGreyBox
            title={
                <div className={`flex items-center justify-between w-full`}>
                    <p className={`text-sm`}>{t(title)}</p>
                    {isEditable && (
                        <Input
                            type={'checkbox'}
                            checked={permissions.every((p) => value.includes(p))}
                            onChange={onCheckboxClicked}
                        />
                    )}
                </div>
            }
            className={className}
        >
            {children}
        </TitledGreyBox>
    );
}, isEqual);

PermissionTitleBox.displayName = 'PermissionTitleBox';

export default PermissionTitleBox;
