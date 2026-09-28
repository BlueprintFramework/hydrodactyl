import { TriangleExclamation } from '@gravity-ui/icons';
import type { EggPreview } from '@/api/server/previewEggChange';
import Spinner from '@/components/elements/Spinner';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { Egg, Nest } from './types';

interface Props {
    selectedEgg: Egg;
    selectedNest: Nest;
    eggPreview: EggPreview;
    currentEggName: string | undefined;
    customStartup: string;
    selectedDockerImage: string;
    pendingVariables: Record<string, string>;
    shouldBackup: boolean;
    shouldWipe: boolean;
    isLoading: boolean;
    onBack: () => void;
    onApply: () => void;
}

const ReviewChanges = ({
    selectedEgg,
    selectedNest,
    eggPreview,
    currentEggName,
    customStartup,
    selectedDockerImage,
    pendingVariables,
    shouldBackup,
    shouldWipe,
    isLoading,
    onBack,
    onApply,
}: Props) => {
    const { t } = useTranslation();

    return (
        <div className='space-y-6'>
            <TitledGreyBox title={t('server.software.review.title')}>
                {selectedEgg && eggPreview && (
                    <div className='space-y-6'>
                        <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                            <h3 className='text-lg font-semibold text-neutral-200 mb-4'>
                                {t('server.software.review.change_summary')}
                            </h3>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                                <div>
                                    <span className='text-neutral-400'>{t('server.software.review.from')}</span>
                                    <div className='text-neutral-200 font-medium'>
                                        {currentEggName || t('server.software.review.no_software')}
                                    </div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>{t('server.software.review.to')}</span>
                                    <div className='text-brand font-medium'>{selectedEgg.attributes.name}</div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>{t('server.software.review.category')}</span>
                                    <div className='text-neutral-200 font-medium'>
                                        {selectedNest?.attributes.name}
                                    </div>
                                </div>
                                <div>
                                    <span className='text-neutral-400'>
                                        {t('server.software.review.docker_image')}
                                    </span>
                                    <div className='text-neutral-200 font-medium'>
                                        {selectedDockerImage || t('server.software.review.default')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                            <h3 className='text-lg font-semibold text-neutral-200 mb-4'>
                                {t('server.software.review.startup_configuration')}
                            </h3>
                            <div className='space-y-3'>
                                <div>
                                    <span className='text-neutral-400 text-sm'>
                                        {t('server.software.review.startup_command')}
                                    </span>
                                    <div className='mt-1 p-3 bg-[#ffffff08] border border-[#ffffff12] rounded-lg font-mono text-sm text-neutral-200 whitespace-pre-wrap'>
                                        {customStartup || eggPreview.egg.startup}
                                    </div>
                                </div>
                                <div>
                                    <span className='text-neutral-400 text-sm'>
                                        {t('server.software.review.docker_image')}
                                    </span>
                                    <div className='mt-1 p-3 bg-[#ffffff08] border border-[#ffffff12] rounded-lg text-sm text-neutral-200'>
                                        {selectedDockerImage || t('server.software.review.default_image')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {eggPreview.variables.length > 0 && (
                            <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                                <h3 className='text-lg font-semibold text-neutral-200 mb-4'>
                                    {t('server.software.review.variable_configuration')}
                                </h3>
                                <div className='space-y-2'>
                                    {eggPreview.variables.map((variable) => (
                                        <div
                                            key={variable.env_variable}
                                            className='flex justify-between items-center py-2 px-3 bg-[#ffffff08] rounded-lg'
                                        >
                                            <div>
                                                <span className='text-neutral-200 font-medium'>{variable.name}</span>
                                                <span className='text-neutral-500 text-sm ml-2 font-mono'>
                                                    ({variable.env_variable})
                                                </span>
                                            </div>
                                            <div className='text-brand font-mono text-sm'>
                                                {pendingVariables[variable.env_variable] ||
                                                    variable.default_value ||
                                                    t('server.software.review.not_set')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                            <h3 className='text-lg font-semibold text-neutral-200 mb-4'>
                                {t('server.software.review.safety_options')}
                            </h3>
                            <div className='space-y-2'>
                                <div className='flex justify-between items-center py-2 px-3 bg-[#ffffff08] rounded-lg'>
                                    <span className='text-neutral-200'>
                                        {t('server.software.review.create_backup')}
                                    </span>
                                    <span className={shouldBackup ? 'text-green-400' : 'text-neutral-400'}>
                                        {shouldBackup ? t('common.yes') : t('common.no')}
                                    </span>
                                </div>
                                <div className='flex justify-between items-center py-2 px-3 bg-[#ffffff08] rounded-lg'>
                                    <span className='text-neutral-200'>{t('server.software.review.wipe_files')}</span>
                                    <span className={shouldWipe ? 'text-amber-400' : 'text-neutral-400'}>
                                        {shouldWipe ? t('common.yes') : t('common.no')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {eggPreview.warnings && eggPreview.warnings.length > 0 && (
                            <div className='space-y-3'>
                                {eggPreview.warnings.map((warning, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 border rounded-lg ${
                                            warning.severity === 'error'
                                                ? 'bg-red-500/10 border-red-500/20'
                                                : 'bg-amber-500/10 border-amber-500/20'
                                        }`}
                                    >
                                        <div className='flex items-start gap-3'>
                                            <TriangleExclamation
                                                width={22}
                                                height={22}
                                                fill='currentColor'
                                                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                                    warning.severity === 'error' ? 'text-red-400' : 'text-amber-400'
                                                }`}
                                            />
                                            <div>
                                                <h4
                                                    className={`font-semibold mb-2 ${
                                                        warning.severity === 'error'
                                                            ? 'text-red-400'
                                                            : 'text-amber-400'
                                                    }`}
                                                >
                                                    {warning.type === 'subdomain_incompatible'
                                                        ? t('server.software.review.subdomain_deleted')
                                                        : t('common.warning')}
                                                </h4>
                                                <p className='text-sm text-neutral-300'>{warning.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className='p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg'>
                            <div className='flex items-start gap-3'>
                                <TriangleExclamation
                                    width={22}
                                    height={22}
                                    fill='currentColor'
                                    className='w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5'
                                />
                                <div>
                                    <h4 className='text-amber-400 font-semibold mb-2'>
                                        {t('server.software.review.warning_title')}
                                    </h4>
                                    <ul className='text-sm text-neutral-300'>
                                        <li>• {t('server.software.review.warning_stop_reinstall')}</li>
                                        <li>• {t('server.software.review.warning_minutes')}</li>
                                        <li>• {t('server.software.review.warning_files')}</li>
                                    </ul>
                                    <span className='text-sm font-bold mt-4'>
                                        {t('server.software.review.warning_backup_notice')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className='flex flex-col sm:flex-row justify-center gap-3 pt-4'>
                    <Button variant='secondary' onClick={onBack} className='w-full sm:w-auto'>
                        {t('server.software.review.back_to_configure')}
                    </Button>
                    <Button onClick={onApply} disabled={isLoading} className='w-full sm:w-auto'>
                        {isLoading && <Spinner size='small' />}
                        {t('server.software.review.apply_changes')}
                    </Button>
                </div>
            </TitledGreyBox>
        </div>
    );
};

export default ReviewChanges;
