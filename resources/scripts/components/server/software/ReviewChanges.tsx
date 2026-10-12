import { TriangleExclamation } from '@gravity-ui/icons';
import type { EggPreview } from '@/api/server/previewEggChange';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import SoftwareCard from './SoftwareCard';
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
}: Props) => (
    <div className='space-y-6'>
        <SoftwareCard title='Review Changes'>
            {selectedEgg && eggPreview && (
                <div className='space-y-6'>
                    <div className='p-4 bg-mocha-400/60 border border-mocha-300/60 rounded-lg'>
                        <h3 className='text-lg font-semibold text-cream-100 mb-4'>Change Summary</h3>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
                            <div>
                                <span className='text-cream-400/70'>From:</span>
                                <div className='text-cream-100 font-medium'>{currentEggName || 'No software'}</div>
                            </div>
                            <div>
                                <span className='text-cream-400/70'>To:</span>
                                <div className='text-brand font-medium'>{selectedEgg.attributes.name}</div>
                            </div>
                            <div>
                                <span className='text-cream-400/70'>Category:</span>
                                <div className='text-cream-100 font-medium'>{selectedNest?.attributes.name}</div>
                            </div>
                            <div>
                                <span className='text-cream-400/70'>Docker Image:</span>
                                <div className='text-cream-100 font-medium'>{selectedDockerImage || 'Default'}</div>
                            </div>
                        </div>
                    </div>

                    <div className='p-4 bg-mocha-400/60 border border-mocha-300/60 rounded-lg'>
                        <h3 className='text-lg font-semibold text-cream-100 mb-4'>Startup Configuration</h3>
                        <div className='space-y-3'>
                            <div>
                                <span className='text-cream-400/70 text-sm'>Startup Command:</span>
                                <div className='mt-1 p-3 bg-mocha-600 border border-mocha-400 rounded-lg font-mono text-sm text-cream-100 whitespace-pre-wrap'>
                                    {customStartup || eggPreview.egg.startup}
                                </div>
                            </div>
                            <div>
                                <span className='text-cream-400/70 text-sm'>Docker Image:</span>
                                <div className='mt-1 p-3 bg-mocha-600 border border-mocha-400 rounded-lg text-sm text-cream-100'>
                                    {selectedDockerImage || 'Default Image'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {eggPreview.variables.length > 0 && (
                        <div className='p-4 bg-mocha-400/60 border border-mocha-300/60 rounded-lg'>
                            <h3 className='text-lg font-semibold text-cream-100 mb-4'>Variable Configuration</h3>
                            <div className='space-y-2'>
                                {eggPreview.variables.map((variable) => (
                                    <div
                                        key={variable.env_variable}
                                        className='flex justify-between items-center py-2 px-3 bg-mocha-600/70 rounded-lg'
                                    >
                                        <div>
                                            <span className='text-cream-100 font-medium'>{variable.name}</span>
                                            <span className='text-cream-400/50 text-sm ml-2 font-mono'>
                                                ({variable.env_variable})
                                            </span>
                                        </div>
                                        <div className='text-brand font-mono text-sm'>
                                            {pendingVariables[variable.env_variable] ||
                                                variable.default_value ||
                                                'Not set'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className='p-4 bg-mocha-400/60 border border-mocha-300/60 rounded-lg'>
                        <h3 className='text-lg font-semibold text-cream-100 mb-4'>Safety Options</h3>
                        <div className='space-y-2'>
                            <div className='flex justify-between items-center py-2 px-3 bg-mocha-600/70 rounded-lg'>
                                <span className='text-cream-100'>Create Backup</span>
                                <span className={shouldBackup ? 'text-green-400' : 'text-cream-400/70'}>
                                    {shouldBackup ? 'Yes' : 'No'}
                                </span>
                            </div>
                            <div className='flex justify-between items-center py-2 px-3 bg-mocha-600/70 rounded-lg'>
                                <span className='text-cream-100'>Wipe Files</span>
                                <span className={shouldWipe ? 'text-amber-400' : 'text-cream-400/70'}>
                                    {shouldWipe ? 'Yes' : 'No'}
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
                                                    warning.severity === 'error' ? 'text-red-400' : 'text-amber-400'
                                                }`}
                                            >
                                                {warning.type === 'subdomain_incompatible'
                                                    ? 'Subdomain Will Be Deleted'
                                                    : 'Warning'}
                                            </h4>
                                            <p className='text-sm text-cream-400'>{warning.message}</p>
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
                                <h4 className='text-amber-400 font-semibold mb-2'>This will:</h4>
                                <ul className='text-sm text-cream-400'>
                                    <li>• Stop and reinstall your server</li>
                                    <li>• Take several minutes to complete</li>
                                    <li>• Modify and remove some files</li>
                                </ul>
                                <span className='text-sm font-bold mt-4'>
                                    Please ensure you have backups of important data before proceeding.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className='flex flex-col sm:flex-row justify-center gap-3 pt-4'>
                <Button variant='secondary' onClick={onBack} className='w-full sm:w-auto'>
                    Back to Configure
                </Button>
                <Button onClick={onApply} disabled={isLoading} className='w-full sm:w-auto'>
                    {isLoading && <Spinner size='small' />}
                    Apply Changes
                </Button>
            </div>
        </SoftwareCard>
    </div>
);

export default ReviewChanges;
