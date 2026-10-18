import { Link } from 'react-router-dom';

import { useTranslation } from '@/i18n/I18nProvider';

interface ScreenBlockProps {
    title: string;
    message: string;
}

const ScreenBlock = ({ title, message }: ScreenBlockProps) => {
    return (
        <div className='w-full h-full flex gap-12 items-center p-8 max-w-3xl mx-auto'>
            <div className='flex flex-col gap-8 max-w-sm text-left'>
                <h1 className='text-[32px] font-extrabold leading-[98%] tracking-[-0.11rem]'>{title}</h1>
                <p className=''>{message}</p>
            </div>
        </div>
    );
};

const ServerError = ({ title, message }: ScreenBlockProps) => {
    return (
        <div className='w-full h-full flex gap-12 items-center p-8 max-w-3xl mx-auto'>
            <div className='flex flex-col gap-8 max-w-sm text-left'>
                <h1 className='text-[32px] font-extrabold leading-[98%] tracking-[-0.11rem]'>{title}</h1>
                <p className=''>{message}</p>
            </div>
        </div>
    );
};

const NotFound = () => {
    const { t } = useTranslation();

    return (
        <div className='w-full h-full flex gap-12 items-center p-8 max-w-3xl mx-auto'>
            <div className='flex flex-col gap-8 max-w-sm text-left'>
                <h1 className='text-[32px] font-extrabold leading-[98%] tracking-[-0.11rem]'>
                    {t('errors.not_found.title')}
                </h1>
                <p className=''>{t('errors.not_found.description')}</p>
                <div className='flex flex-col gap-2'>
                    <Link to={'/'} className='text-brand'>
                        {t('errors.not_found.your_servers')}
                    </Link>
                </div>
            </div>
            <img
                alt=''
                className='w-64 rounded-2xl'
                height='256'
                src='https://media.tenor.com/scX-kVPwUn8AAAAC/this-is-fine.gif'
                width='256'
                loading='lazy'
                decoding='async'
            />
        </div>
    );
};

export { NotFound, ServerError };
export default ScreenBlock;
