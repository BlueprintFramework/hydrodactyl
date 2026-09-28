import { useState } from 'react';
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

    const toggle = () => setShowFull((prev) => !prev);

    return (
        <p className='text-sm text-neutral-400 leading-relaxed'>
            {isLong && !showFull ? (
                <>
                    {description.slice(0, MAX_DESCRIPTION_LENGTH)}...{' '}
                    <button type='button' onClick={toggle} className='text-brand hover:underline font-medium'>
                        {t('server.software.show_more')}
                    </button>
                </>
            ) : (
                <>
                    {description}
                    {isLong && (
                        <>
                            {' '}
                            <button type='button' onClick={toggle} className='text-brand hover:underline font-medium'>
                                {t('server.software.show_less')}
                            </button>
                        </>
                    )}
                </>
            )}
        </p>
    );
};

export default DescriptionText;
