import { Box } from '@gravity-ui/icons';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import SoftwareCard from './SoftwareCard';
import { blank_egg_prefix } from './types';

interface Props {
    currentEggName: string | undefined;
    isLoading: boolean;
    onChangeSoftware: () => void;
}

const SoftwareOverview = ({ currentEggName, isLoading, onChangeSoftware }: Props) => (
    <SoftwareCard title='Current Software'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex items-center gap-3 sm:gap-4 min-w-0 flex-1'>
                <div className='w-10 h-10 sm:w-12 sm:h-12 bg-mocha-400 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <Box width={22} height={22} fill='currentColor' className='w-5 h-5 sm:w-6 sm:h-6 text-cream-400' />
                </div>
                <div className='min-w-0 flex-1'>
                    {currentEggName ? (
                        currentEggName.includes(blank_egg_prefix) ? (
                            <p className='text-amber-400 font-medium text-sm sm:text-base'>No software selected</p>
                        ) : (
                            <p className='text-cream-100 font-medium text-sm sm:text-base truncate'>{currentEggName}</p>
                        )
                    ) : (
                        <div className='flex items-center gap-2'>
                            <Spinner size='small' />
                            <span className='text-cream-400/70 text-sm'>Loading...</span>
                        </div>
                    )}
                    <p className='text-xs sm:text-sm text-cream-400/70 leading-relaxed'>
                        Manage your server&apos;s game or software configuration
                    </p>
                </div>
            </div>
            <div className='flex-shrink-0 w-full sm:w-auto'>
                <Button onClick={onChangeSoftware} className='w-full sm:w-auto' disabled={isLoading}>
                    {isLoading && <Spinner size='small' />}
                    Change Software
                </Button>
            </div>
        </div>
    </SoftwareCard>
);

export default SoftwareOverview;
