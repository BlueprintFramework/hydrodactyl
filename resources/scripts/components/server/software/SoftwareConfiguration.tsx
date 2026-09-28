import type { EggPreview } from '@/api/server/previewEggChange';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import { Switch } from '@/components/elements/SwitchV2';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { Egg } from './types';

interface Props {
    selectedEgg: Egg;
    eggPreview: EggPreview;
    customStartup: string;
    selectedDockerImage: string;
    pendingVariables: Record<string, string>;
    variableErrors: Record<string, string>;
    shouldBackup: boolean;
    shouldWipe: boolean;
    backupLimit: number | null | undefined;
    backupCount: number;
    onStartupChange: (value: string) => void;
    onDockerImageChange: (value: string) => void;
    onVariableChange: (envVariable: string, value: string) => void;
    onBackupChange: (value: boolean) => void;
    onWipeChange: (value: boolean) => void;
    onBack: () => void;
    onReview: () => void;
}

const SoftwareConfiguration = ({
    selectedEgg,
    eggPreview,
    customStartup,
    selectedDockerImage,
    pendingVariables,
    variableErrors,
    shouldBackup,
    shouldWipe,
    backupLimit,
    backupCount,
    onStartupChange,
    onDockerImageChange,
    onVariableChange,
    onBackupChange,
    onWipeChange,
    onBack,
    onReview,
}: Props) => {
    const { t } = useTranslation();
    const variableExamples = eggPreview.variables
        .map((v) => `{{${v.env_variable}}}`)
        .slice(0, 3)
        .join(', ');
    const variableHelper = eggPreview.variables.length > 3 ? `${variableExamples}, etc.` : variableExamples;

    return (
        <div className='space-y-6'>
            <TitledGreyBox title={t('server.software.configuration.title', { egg: selectedEgg.attributes.name })}>
                {eggPreview && (
                    <div className='space-y-6'>
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-neutral-200'>
                                {t('server.software.configuration.heading')}
                            </h3>
                            <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
                                <div>
                                    <label
                                        htmlFor='startup_command'
                                        className='text-sm font-medium text-neutral-300 block mb-2'
                                    >
                                        {t('server.software.configuration.startup_command')}
                                    </label>
                                    <textarea
                                        id='startup_command'
                                        value={customStartup}
                                        onChange={(e) => onStartupChange(e.target.value)}
                                        placeholder={t('server.software.configuration.startup_placeholder')}
                                        rows={3}
                                        className='w-full px-3 py-2 bg-[#ffffff08] border border-[#ffffff12] rounded-lg text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-brand transition-colors font-mono resize-none'
                                    />
                                    <p className='text-xs text-neutral-400 mt-1'>
                                        {t('server.software.configuration.use_variables', {
                                            variables: variableHelper,
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <label
                                        htmlFor='docker_image_trigger'
                                        className='text-sm font-medium text-neutral-300 block mb-2'
                                    >
                                        {t('server.software.configuration.docker_image')}
                                    </label>
                                    {eggPreview.docker_images && Object.keys(eggPreview.docker_images).length > 1 ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    id='docker_image_trigger'
                                                    type='button'
                                                    className='w-full px-3 py-2 bg-[#ffffff08] border border-[#ffffff12] rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-brand transition-colors text-left flex items-center justify-between hover:border-[#ffffff20]'
                                                >
                                                    <span className='truncate'>
                                                        {selectedDockerImage ||
                                                            t('server.software.configuration.select_image')}
                                                    </span>
                                                    <svg
                                                        className='w-4 h-4 text-neutral-400 flex-shrink-0'
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                        aria-hidden='true'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M19 9l-7 7-7-7'
                                                        />
                                                    </svg>
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className='w-full min-w-[300px]'>
                                                <DropdownMenuRadioGroup
                                                    value={selectedDockerImage}
                                                    onValueChange={onDockerImageChange}
                                                >
                                                    {Object.entries(eggPreview.docker_images).map(
                                                        ([displayName, _]) => (
                                                            <DropdownMenuRadioItem
                                                                key={displayName}
                                                                value={displayName}
                                                                className='text-sm font-mono'
                                                            >
                                                                <span>{displayName}</span>
                                                            </DropdownMenuRadioItem>
                                                        ),
                                                    )}
                                                </DropdownMenuRadioGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        <div className='w-full px-3 py-2 bg-[#ffffff08] border border-[#ffffff12] rounded-lg text-sm text-neutral-200'>
                                            {(eggPreview.docker_images && Object.keys(eggPreview.docker_images)[0]) ||
                                                t('server.software.configuration.default_image')}
                                        </div>
                                    )}
                                    <p className='text-xs text-neutral-400 mt-1'>
                                        {t('server.software.configuration.container_runtime')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {eggPreview.variables.length > 0 && (
                            <div className='space-y-4'>
                                <h3 className='text-lg font-semibold text-neutral-200'>
                                    {t('server.software.configuration.env_variables')}
                                </h3>
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                                    {eggPreview.variables.map((variable) => (
                                        <div key={variable.env_variable} className='space-y-3'>
                                            <div>
                                                <label
                                                    htmlFor={variable.env_variable}
                                                    className='text-sm font-medium text-neutral-200 block mb-1'
                                                >
                                                    {variable.name}
                                                    {!variable.user_editable && (
                                                        <span className='ml-2 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded'>
                                                            {t('server.software.configuration.read_only')}
                                                        </span>
                                                    )}
                                                    {variable.user_editable && variable.rules.includes('required') && (
                                                        <span className='ml-2 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded'>
                                                            {t('server.software.configuration.required')}
                                                        </span>
                                                    )}
                                                    {variable.user_editable &&
                                                        !variable.rules.includes('required') && (
                                                            <span className='ml-2 px-2 py-0.5 text-xs bg-neutral-500/20 text-neutral-400 rounded'>
                                                                {t('common.optional')}
                                                            </span>
                                                        )}
                                                </label>
                                                {variable.description && (
                                                    <p className='text-xs text-neutral-400 mb-2'>{variable.description}</p>
                                                )}
                                            </div>

                                            {variable.user_editable ? (
                                                <div>
                                                    <input
                                                        id={variable.env_variable}
                                                        type='text'
                                                        value={pendingVariables[variable.env_variable] || ''}
                                                        onChange={(e) =>
                                                            onVariableChange(variable.env_variable, e.target.value)
                                                        }
                                                        placeholder={
                                                            variable.default_value ||
                                                            t('server.startup.variables.placeholder')
                                                        }
                                                        className={`w-full px-3 py-2 bg-[#ffffff08] border rounded-lg text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none transition-colors ${
                                                            variableErrors[variable.env_variable]
                                                                ? 'border-red-500 focus:border-red-500'
                                                                : 'border-[#ffffff12] focus:border-brand'
                                                        }`}
                                                    />
                                                    {variableErrors[variable.env_variable] && (
                                                        <p className='text-xs text-red-400 mt-1'>
                                                            {variableErrors[variable.env_variable]}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className='w-full px-3 py-2 bg-[#ffffff04] border border-[#ffffff08] rounded-lg text-sm text-neutral-300 font-mono'>
                                                    {pendingVariables[variable.env_variable] ||
                                                        variable.default_value ||
                                                        t('server.software.configuration.not_set')}
                                                </div>
                                            )}

                                            <div className='flex justify-between text-xs'>
                                                <span className='text-neutral-500 font-mono'>
                                                    {variable.env_variable}
                                                </span>
                                                {variable.rules && (
                                                    <span className='text-neutral-500'>
                                                        {t('server.software.configuration.rules', {
                                                            rules: variable.rules,
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-neutral-200'>
                                {t('server.software.configuration.safety_options')}
                            </h3>
                            <div className='space-y-3'>
                                <div className='flex items-center justify-between p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg hover:border-[#ffffff20] transition-colors'>
                                    <div className='flex-1 min-w-0 pr-4'>
                                        <label
                                            htmlFor='create-backup-switch'
                                            className='text-sm font-medium text-neutral-200 block mb-1'
                                        >
                                            {t('server.software.configuration.create_backup')}
                                        </label>
                                        <p className='text-xs text-neutral-400 leading-relaxed'>
                                            {backupLimit !== 0 && (backupLimit === null || backupCount < backupLimit)
                                                ? t('server.software.configuration.backup_auto')
                                                : backupLimit === 0
                                                  ? t('server.software.configuration.backup_disabled')
                                                  : t('server.software.configuration.backup_limit')}
                                        </p>
                                    </div>
                                    <div className='flex-shrink-0'>
                                        <Switch
                                            id='create-backup-switch'
                                            checked={shouldBackup}
                                            onCheckedChange={onBackupChange}
                                            disabled={
                                                backupLimit === 0 ||
                                                (backupLimit !== null && backupCount >= backupLimit)
                                            }
                                        />
                                    </div>
                                </div>

                                <div className='flex items-center justify-between p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg hover:border-[#ffffff20] transition-colors'>
                                    <div className='flex-1 min-w-0 pr-4'>
                                        <label
                                            htmlFor='wipe-files-switch'
                                            className='text-sm font-medium text-neutral-200 block mb-1'
                                        >
                                            {t('server.software.configuration.wipe_files')}
                                        </label>
                                        <p className='text-xs text-neutral-400 leading-relaxed'>
                                            {t('server.software.configuration.delete_files')}
                                        </p>
                                    </div>
                                    <div className='flex-shrink-0'>
                                        <Switch
                                            id='wipe-files-switch'
                                            checked={shouldWipe}
                                            onCheckedChange={onWipeChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className='flex flex-col sm:flex-row justify-center gap-3 pt-4'>
                    <Button variant='secondary' onClick={onBack} className='w-full sm:w-auto'>
                        {t('server.software.configuration.back_to_software')}
                    </Button>
                    <Button onClick={onReview} disabled={!eggPreview} className='w-full sm:w-auto'>
                        {t('server.software.configuration.review_changes')}
                    </Button>
                </div>
            </TitledGreyBox>
        </div>
    );
};

export default SoftwareConfiguration;
