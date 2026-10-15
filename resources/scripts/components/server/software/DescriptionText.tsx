import { useState } from 'react';
import { MAX_DESCRIPTION_LENGTH } from './types';

interface Props {
    description: string;
    id: string;
}

const DescriptionText = ({ description, id: _id }: Props) => {
    const [showFull, setShowFull] = useState(false);
    const isLong = description.length > MAX_DESCRIPTION_LENGTH;

    const toggle = () => setShowFull((prev) => !prev);

    return (
        <p className='text-sm text-cream-400/70 leading-relaxed'>
            {isLong && !showFull ? (
                <>
                    {description.slice(0, MAX_DESCRIPTION_LENGTH)}...{' '}
                    <button type='button' onClick={toggle} className='text-brand hover:underline font-medium'>
                        Show more
                    </button>
                </>
            ) : (
                <>
                    {description}
                    {isLong && (
                        <>
                            {' '}
                            <button type='button' onClick={toggle} className='text-brand hover:underline font-medium'>
                                Show less
                            </button>
                        </>
                    )}
                </>
            )}
        </p>
    );
};

export default DescriptionText;
