import { type KeyboardEvent, type MouseEvent, useState } from 'react';
import { useTranslation } from '@/i18n/I18nProvider';
import { MAX_DESCRIPTION_LENGTH } from './types';

interface Props {
    description: string;
    id: string;
}

const DescriptionText = ({ description, id: _id }: Props) => {
    const { t } = useTranslation();
    const [showFull, setShowFull] = useState(false);
    const isLong = description.length > MAX_DESCRIPTION_LENGTH;

    // The description lives inside cards that are themselves buttons, so the
    // toggle cannot be a real <button> (nested buttons are invalid and the
    // click would select the card). Stop the event instead of bubbling it up.
    const toggle = (event: MouseEvent | KeyboardEvent) => {
        event.stopPropagation();
        setShowFull((prev) => !prev);
    };

    const toggleProps = {
        role: 'button' as const,
        tabIndex: 0,
        onClick: toggle,
        onKeyDown: (event: KeyboardEvent) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggle(event);
            }
        },
        className: 'text-brand hover:underline font-medium cursor-pointer',
    };

    return (
        <p className='text-sm text-cream-400/70 leading-relaxed'>
            {isLong && !showFull ? (
                <>
                    {description.slice(0, MAX_DESCRIPTION_LENGTH)}...{' '}
                    <span {...toggleProps}>{t('server.software.show_more')}</span>
                </>
            ) : (
                <>
                    {description}
                    {isLong && (
                        <>
                            {' '}
                            <span {...toggleProps}>{t('server.software.show_less')}</span>
                        </>
                    )}
                </>
            )}
        </p>
    );
};

export default DescriptionText;
