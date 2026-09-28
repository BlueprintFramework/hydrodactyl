import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import DescriptionText from './DescriptionText';
import type { Nest } from './types';

const hidden_nest_prefix = '!';

interface Props {
    nests: Nest[];
    onSelectNest: (nest: Nest) => void;
    onBack: () => void;
}

const GameSelection = ({ nests, onSelectNest, onBack }: Props) => {
    const { t } = useTranslation();

    return (
        <TitledGreyBox title={t('server.software.game.title')}>
            <div className='space-y-4'>
                <p className='text-sm text-neutral-400'>{t('server.software.game.description')}</p>

                <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4'>
                    {nests?.map((nest) =>
                        nest?.attributes?.name?.includes(hidden_nest_prefix) ? null : (
                            <button
                                type='button'
                                key={nest?.attributes?.uuid}
                                onClick={() => onSelectNest(nest)}
                                className='p-4 sm:p-5 bg-[#ffffff08] border border-[#ffffff12] rounded-lg hover:border-[#ffffff20] transition-all text-left active:bg-[#ffffff12] touch-manipulation'
                            >
                                <h3 className='font-semibold text-neutral-200 mb-2 text-base sm:text-lg'>
                                    {nest?.attributes?.name}
                                </h3>
                                <DescriptionText
                                    description={nest?.attributes?.description || ''}
                                    id={`nest-${nest?.attributes?.uuid}`}
                                />
                            </button>
                        ),
                    )}
                </div>

                <div className='flex justify-center pt-4'>
                    <Button variant='secondary' onClick={onBack} className='w-full sm:w-auto'>
                        {t('server.software.game.back_to_overview')}
                    </Button>
                </div>
            </div>
        </TitledGreyBox>
    );
};

export default GameSelection;
