import type { EggPreview } from '@/api/server/previewEggChange';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import { Switch } from '@/components/elements/SwitchV2';
import { Button } from '@/components/ui/button';
import SoftwareCard from './SoftwareCard';
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
}: Props) => (
    <div className='space-y-6'>
        <SoftwareCard title={`Configure ${selectedEgg?.attributes.name}`}>
            {eggPreview && (
                <div className='space-y-6'>
                    <div className='space-y-4'>
                        <h3 className='text-lg font-semibold text-cream-100'>Software Configuration</h3>
                        <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
                            <div>
                                <label
                                    htmlFor='startup_command'
                                    className='text-sm font-medium text-cream-400 block mb-2'
                                >
                                    Startup Command
                                </label>
                                <textarea
                                    id='startup_command'
                                    value={customStartup}
                                    onChange={(e) => onStartupChange(e.target.value)}
                                    placeholder='Enter custom startup command...'
                                    rows={3}
                                    className='w-full px-3 py-2 bg-mocha-400/60 border border-mocha-300/60 rounded-lg text-sm text-cream-100 placeholder:text-cream-400/40 focus:outline-none focus:border-brand-400/60 transition-colors font-mono resize-none'
                                />
                                <p className='text-xs text-cream-400/70 mt-1'>
                                    Use variables like{' '}
                                    {eggPreview.variables
                                        .map((v) => `{{${v.env_variable}}}`)
                                        .slice(0, 3)
                                        .join(', ')}
                                    {eggPreview.variables.length > 3 && ', etc.'}
                                </p>
                            </div>
                            <div>
                                <label
                                    htmlFor='docker_image_trigger'
                                    className='text-sm font-medium text-cream-400 block mb-2'
                                >
                                    Docker Image
                                </label>
                                {eggPreview.docker_images && Object.keys(eggPreview.docker_images).length > 1 ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                id='docker_image_trigger'
                                                type='button'
                                                className='w-full px-3 py-2 bg-mocha-400/60 border border-mocha-300/60 rounded-lg text-sm text-cream-100 focus:outline-none focus:border-brand-400/60 transition-colors text-left flex items-center justify-between hover:border-brand-400/60'
                                            >
                                                <span className='truncate'>
                                                    {selectedDockerImage || 'Select image...'}
                                                </span>
                                                <svg
                                                    className='w-4 h-4 text-cream-400/70 flex-shrink-0'
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
                                                {Object.entries(eggPreview.docker_images).map(([displayName, _]) => (
                                                    <DropdownMenuRadioItem
                                                        key={displayName}
                                                        value={displayName}
                                                        className='text-sm font-mono'
                                                    >
                                                        <span>{displayName}</span>
                                                    </DropdownMenuRadioItem>
                                                ))}
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <div className='w-full px-3 py-2 bg-mocha-400/60 border border-mocha-300/60 rounded-lg text-sm text-cream-100'>
                                        {(eggPreview.docker_images && Object.keys(eggPreview.docker_images)[0]) ||
                                            'Default Image'}
                                    </div>
                                )}
                                <p className='text-xs text-cream-400/70 mt-1'>
                                    Container runtime environment for your server
                                </p>
                            </div>
                        </div>
                    </div>

                    {eggPreview.variables.length > 0 && (
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-cream-100'>Environment Variables</h3>
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
                                                        Read-only
                                                    </span>
                                                )}
                                                {variable.user_editable && variable.rules.includes('required') && (
                                                    <span className='ml-2 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded'>
                                                        Required
                                                    </span>
                                                )}
                                                {variable.user_editable && !variable.rules.includes('required') && (
                                                    <span className='ml-2 px-2 py-0.5 text-xs bg-mocha-400/60 text-cream-400/70 rounded'>
                                                        Optional
                                                    </span>
                                                )}
                                            </label>
                                            {variable.description && (
                                                <p className='text-xs text-cream-400/70 mb-2'>{variable.description}</p>
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
                                                    placeholder={variable.default_value || 'Enter value...'}
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
                                                    'Not set'}
                                            </div>
                                        )}

                                        <div className='flex justify-between text-xs'>
                                            <span className='text-cream-400/50 font-mono'>{variable.env_variable}</span>
                                            {variable.rules && (
                                                <span className='text-cream-400/50'>Rules: {variable.rules}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className='space-y-4'>
                        <h3 className='text-lg font-semibold text-cream-100'>Safety Options</h3>
                        <div className='space-y-3'>
                            <div className='flex items-center justify-between p-4 bg-mocha-400/60 border border-mocha-300/60 rounded-lg hover:border-brand-400/60 transition-colors'>
                                <div className='flex-1 min-w-0 pr-4'>
                                    <label
                                        htmlFor='create-backup-switch'
                                        className='text-sm font-medium text-cream-100 block mb-1'
                                    >
                                        Create Backup
                                    </label>
                                    <p className='text-xs text-cream-400/70 leading-relaxed'>
                                        {backupLimit !== 0 && (backupLimit === null || backupCount < backupLimit)
                                            ? 'Automatically create a backup before applying changes'
                                            : backupLimit === 0
                                              ? 'Backups are disabled for this server'
                                              : 'Backup limit reached'}
                                    </p>
                                </div>
                                <div className='flex-shrink-0'>
                                    <Switch
                                        id='create-backup-switch'
                                        checked={shouldBackup}
                                        onCheckedChange={onBackupChange}
                                        disabled={
                                            backupLimit === 0 || (backupLimit !== null && backupCount >= backupLimit)
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
                                        Wipe Files
                                    </label>
                                    <p className='text-xs text-cream-400/70 leading-relaxed'>
                                        Delete all files before installing new software
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
                    Back to Software
                </Button>
                <Button onClick={onReview} disabled={!eggPreview} className='w-full sm:w-auto'>
                    Review Changes
                </Button>
            </div>
        </SoftwareCard>
    </div>
);

export default SoftwareConfiguration;
