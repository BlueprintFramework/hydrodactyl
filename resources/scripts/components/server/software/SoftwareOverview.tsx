import { Box } from '@gravity-ui/icons';
import Spinner from '@/components/elements/Spinner';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import { blank_egg_prefix } from './types';

interface Props {
    currentEggName: string | undefined;
    isLoading: boolean;
    onChangeSoftware: () => void;
}

const SoftwareOverview = ({ currentEggName, isLoading, onChangeSoftware }: Props) => {
    const { t } = useTranslation();

    return (
        <TitledGreyBox title={t('server.software.overview.current_software')}>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex items-center gap-3 sm:gap-4 min-w-0 flex-1'>
                    <div className='w-10 h-10 sm:w-12 sm:h-12 bg-[#ffffff11] rounded-lg flex items-center justify-center flex-shrink-0'>
                        <Box
                            width={22}
                            height={22}
                            fill='currentColor'
                            className='w-5 h-5 sm:w-6 sm:h-6 text-neutral-300'
                        />
                    </div>
                    <div className='min-w-0 flex-1'>
                        {currentEggName ? (
                            currentEggName.includes(blank_egg_prefix) ? (
                                <p className='text-amber-400 font-medium text-sm sm:text-base'>
                                    {t('server.software.overview.no_software_selected')}
                                </p>
                            ) : (
                                <p className='text-neutral-200 font-medium text-sm sm:text-base truncate'>
                                    {currentEggName}
                                </p>
                            )
                        ) : (
                            <div className='flex items-center gap-2'>
                                <Spinner size='small' />
                                <span className='text-neutral-400 text-sm'>{t('common.loading')}</span>
                            </div>
                        )}
                        <p className='text-xs sm:text-sm text-neutral-400 leading-relaxed'>
                            {t('server.software.overview.description')}
                        </p>
                    </div>
                </div>
                <div className='flex-shrink-0 w-full sm:w-auto'>
                    <Button onClick={onChangeSoftware} className='w-full sm:w-auto' disabled={isLoading}>
                        {isLoading && <Spinner size='small' />}
                        {t('server.software.overview.change_software')}
                    </Button>
                </div>
            </div>
        </TitledGreyBox>
    );
};

export default SoftwareOverview;
