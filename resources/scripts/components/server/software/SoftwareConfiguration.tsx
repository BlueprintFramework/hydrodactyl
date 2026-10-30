import type { EggPreview } from '@/api/server/previewEggChange';
import Dropdown from '@/components/elements/Dropdown';
import { Switch } from '@/components/elements/SwitchV2';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import SoftwareCard from './SoftwareCard';
import type { Egg } from './types';

interface Props {
    selectedEgg: Egg;
    eggPreview: EggPreview;
    customStartup: string;
    canEditStartupCommand: boolean;
    canCreateBackups: boolean;
    canWipeFiles: boolean;
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
    canEditStartupCommand,
    canCreateBackups,
    canWipeFiles,
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

    return (
        <div className='space-y-6'>
            <SoftwareCard title={t('server.software.configuration.title', { egg: selectedEgg?.attributes.name })}>
                {eggPreview && (
                    <div className='space-y-6'>
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-cream-100'>
                                {t('server.software.configuration.heading')}
                            </h3>
                            <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
                                <div>
                                    <label
                                        htmlFor='startup_command'
                                        className='text-sm font-medium text-cream-400 block mb-2'
                                    >
                                        {t('server.software.configuration.startup_command')}
                                    </label>
                                    <textarea
                                        id='startup_command'
                                        value={customStartup}
                                        onChange={(e) => onStartupChange(e.target.value)}
                                        placeholder={t('server.software.configuration.startup_placeholder')}
                                        rows={3}
                                        disabled={!canEditStartupCommand}
                                        className='w-full px-3 py-2 bg-mocha-400/60 border border-mocha-300/60 rounded-lg text-sm text-cream-100 placeholder:text-cream-400/40 focus:outline-none focus:border-brand-400/60 transition-colors font-mono resize-none disabled:cursor-not-allowed disabled:opacity-60'
                                    />
                                    {canEditStartupCommand ? (
                                        <p className='text-xs text-cream-400/70 mt-1'>
                                            {t('server.software.configuration.use_variables', {
                                                variables: eggPreview.variables
                                                    .map((v) => `{{${v.env_variable}}}`)
                                                    .slice(0, 3)
                                                    .join(', '),
                                            })}
                                            {eggPreview.variables.length > 3 && t('server.software.configuration.etc')}
                                        </p>
                                    ) : (
                                        <p className='text-xs text-brand-400 mt-1'>
                                            {t('server.software.configuration.startup_command_forbidden')}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor='docker_image_trigger'
                                        className='text-sm font-medium text-cream-400 block mb-2'
                                    >
                                        {t('server.software.configuration.docker_image')}
                                    </label>
                                    {eggPreview.docker_images && Object.keys(eggPreview.docker_images).length > 1 ? (
                                        <Dropdown
                                            id='docker_image_trigger'
                                            value={selectedDockerImage}
                                            onChange={onDockerImageChange}
                                            placeholder={t('server.software.configuration.select_image')}
                                            triggerClassName='font-mono'
                                            options={Object.keys(eggPreview.docker_images).map((displayName) => ({
                                                value: displayName,
                                                label: displayName,
                                            }))}
                                        />
                                    ) : (
                                        <div className='w-full px-3 py-2 bg-mocha-400/60 border border-mocha-300/60 rounded-lg text-sm text-cream-100'>
                                            {(eggPreview.docker_images && Object.keys(eggPreview.docker_images)[0]) ||
                                                t('server.software.configuration.default_image')}
                                        </div>
                                    )}
                                    <p className='text-xs text-cream-400/70 mt-1'>
                                        {t('server.software.configuration.container_runtime')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {eggPreview.variables.length > 0 && (
                            <div className='space-y-4'>
                                <h3 className='text-lg font-semibold text-cream-100'>
                                    {t('server.software.configuration.env_variables')}
                                </h3>
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                                    {eggPreview.variables.map((variable) => (
                                        <div key={variable.env_variable} className='space-y-3'>
                                            <div>
                                                <label
                                                    htmlFor={variable.env_variable}
                                                    className='text-sm font-medium text-cream-100 block mb-1'
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
                                                    {variable.user_editable && !variable.rules.includes('required') && (
                                                        <span className='ml-2 px-2 py-0.5 text-xs bg-mocha-400/60 text-cream-400/70 rounded'>
                                                            {t('common.optional')}
                                                        </span>
                                                    )}
                                                </label>
                                                {variable.description && (
                                                    <p className='text-xs text-cream-400/70 mb-2'>
                                                        {variable.description}
                                                    </p>
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
                                                            t('server.software.configuration.enter_value')
                                                        }
                                                        className={`w-full px-3 py-2 bg-mocha-400/60 border rounded-lg text-sm text-cream-100 placeholder:text-cream-400/40 focus:outline-none transition-colors ${
                                                            variableErrors[variable.env_variable]
                                                                ? 'border-red-500 focus:border-red-500'
                                                                : 'border-mocha-300/60 focus:border-brand-400/60'
                                                        }`}
                                                    />
                                                    {variableErrors[variable.env_variable] && (
                                                        <p className='text-xs text-red-400 mt-1'>
                                                            {variableErrors[variable.env_variable]}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className='w-full px-3 py-2 bg-mocha-600 border border-mocha-400 rounded-lg text-sm text-cream-400 font-mono'>
                                                    {pendingVariables[variable.env_variable] ||
                                                        variable.default_value ||
                                                        t('server.software.configuration.not_set')}
                                                </div>
                                            )}

                                            <div className='flex justify-between text-xs'>
                                                <span className='text-cream-400/50 font-mono'>
                                                    {variable.env_variable}
                                                </span>
                                                {variable.rules && (
                                                    <span className='text-cream-400/50'>
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
                            <h3 className='text-lg font-semibold text-cream-100'>
                                {t('server.software.configuration.safety_options')}
                            </h3>
                            <div className='space-y-3'>
                                <div className='flex items-center justify-between p-4 bg-mocha-400/60 border border-mocha-300/60 rounded-lg hover:border-brand-400/60 transition-colors'>
                                    <div className='flex-1 min-w-0 pr-4'>
                                        <label
                                            htmlFor='create-backup-switch'
                                            className='text-sm font-medium text-cream-100 block mb-1'
                                        >
                                            {t('server.software.configuration.create_backup')}
                                        </label>
                                        <p
                                            className={`text-xs leading-relaxed ${
                                                canCreateBackups ? 'text-cream-400/70' : 'text-brand-400'
                                            }`}
                                        >
                                            {!canCreateBackups
                                                ? t('server.software.configuration.missing_backup_permission')
                                                : backupLimit !== 0 &&
                                                    (backupLimit === null || backupCount < backupLimit)
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
                                                !canCreateBackups ||
                                                backupLimit === 0 ||
                                                (backupLimit !== null && backupCount >= backupLimit)
                                            }
                                        />
                                    </div>
                                </div>

                                <div className='flex items-center justify-between p-4 bg-mocha-400/60 border border-mocha-300/60 rounded-lg hover:border-brand-400/60 transition-colors'>
                                    <div className='flex-1 min-w-0 pr-4'>
                                        <label
                                            htmlFor='wipe-files-switch'
                                            className='text-sm font-medium text-cream-100 block mb-1'
                                        >
                                            {t('server.software.configuration.wipe_files')}
                                        </label>
                                        <p
                                            className={`text-xs leading-relaxed ${
                                                canWipeFiles ? 'text-cream-400/70' : 'text-brand-400'
                                            }`}
                                        >
                                            {canWipeFiles
                                                ? t('server.software.configuration.delete_files')
                                                : t('server.software.configuration.missing_file_permission')}
                                        </p>
                                    </div>
                                    <div className='flex-shrink-0'>
                                        <Switch
                                            id='wipe-files-switch'
                                            checked={shouldWipe}
                                            onCheckedChange={onWipeChange}
                                            disabled={!canWipeFiles}
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
            </SoftwareCard>
        </div>
    );
};

export default SoftwareConfiguration;
