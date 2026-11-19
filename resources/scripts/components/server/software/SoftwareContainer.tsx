import { useEffect, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { toast } from 'sonner';
import { httpErrorToHuman } from '@/api/http';
import applyEggChange from '@/api/server/applyEggChange';
import previewEggChange, { type EggPreview } from '@/api/server/previewEggChange';
import getServerBackups from '@/api/swr/getServerBackups';
import getServerStartup from '@/api/swr/getServerStartup';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import ServerHeader from '@/components/server/header/ServerHeader';
import { useTranslation } from '@/i18n/I18nProvider';
import { rememberServerOperation } from '@/lib/serverOperationTracker';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import { useNests } from '@/plugins/useNests';
import { usePermissions } from '@/plugins/usePermissions';
import { ServerContext } from '@/state/server';
import GameSelection from './GameSelection';
import { eggNameToMcjarsType, pickJavaDockerImage } from './mcjarsTypes';
import ReviewChanges from './ReviewChanges';
import SoftwareConfiguration from './SoftwareConfiguration';
import SoftwareOverview from './SoftwareOverview';
import SoftwareSelection from './SoftwareSelection';
import type { Egg, FlowStep, Nest } from './types';
import { hidden_nest_prefix, validateEnvironmentVariables } from './types';
import VersionSelection from './VersionSelection';
import WipeConfirmationModal from './WipeConfirmationModal';

const isMinecraftNest = (nest: Nest): boolean => {
    const name = nest.attributes.name?.toLowerCase() || '';
    return name.includes('minecraft') && !name.includes(hidden_nest_prefix);
};

const SoftwareContainer = () => {
    const { t } = useTranslation();
    const serverData = ServerContext.useStoreState((state) => state.server.data);
    const uuid = serverData?.uuid;
    const [
        canEditStartupCommand = false,
        canReadStartup = false,
        canUpdateStartup = false,
        canChangeDockerImage = false,
        canReinstall = false,
        canReadBackups = false,
        canCreateBackups = false,
        canReadFiles = false,
        canDeleteFiles = false,
    ] = usePermissions([
        'startup.command',
        'startup.read',
        'startup.update',
        'startup.docker-image',
        'settings.reinstall',
        'backup.read',
        'backup.create',
        'file.read',
        'file.delete',
    ]);
    const canCustomizeStartup = canEditStartupCommand;
    const canWipeFilesOption = canReadFiles && canDeleteFiles;
    const missingBasePermissions = !canReadStartup || !canUpdateStartup || !canChangeDockerImage || !canReinstall;
    const { data: nests } = useNests();
    const currentEgg = serverData?.egg;
    const currentEggName = useMemo(() => {
        if (!nests || !currentEgg) return undefined;

        const foundNest = nests.find((nest) =>
            nest?.attributes?.relationships?.eggs?.data?.find((egg) => egg?.attributes?.uuid === currentEgg),
        );

        return foundNest?.attributes?.relationships?.eggs?.data?.find((egg) => egg?.attributes?.uuid === currentEgg)
            ?.attributes?.name;
    }, [nests, currentEgg]);
    const backupLimit = serverData?.featureLimits.backups;
    const { data: backups } = getServerBackups(canReadBackups);
    const backupCount = backups?.items.length ?? 0;
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    const [currentStep, setCurrentStep] = useState<FlowStep>('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedNest, setSelectedNest] = useState<Nest | null>(null);
    const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
    const [eggPreview, setEggPreview] = useState<EggPreview | null>(null);
    const [pendingVariables, setPendingVariables] = useState<Record<string, string>>({});
    const [variableErrors, setVariableErrors] = useState<Record<string, string>>({});
    const [showWipeConfirmation, setShowWipeConfirmation] = useState(false);
    const [wipeCountdown, setWipeCountdown] = useState(5);
    const [wipeLoading, setWipeLoading] = useState(false);
    const [shiftPressed, setShiftPressed] = useState(false);

    const [shouldBackup, setShouldBackup] = useState(false);
    const [shouldWipe, setShouldWipe] = useState(false);

    const [customStartup, setCustomStartup] = useState('');
    const [selectedDockerImage, setSelectedDockerImage] = useState('');
    const [selectedMcjarsType, setSelectedMcjarsType] = useState<string | null>(null);

    const hasCustomStartup = !!eggPreview && !!customStartup && customStartup !== eggPreview.egg.startup;
    const canApplyChanges =
        !missingBasePermissions &&
        !(shouldBackup && !canCreateBackups) &&
        !(shouldWipe && !canWipeFilesOption) &&
        !(hasCustomStartup && !canCustomizeStartup);

    const variables = ServerContext.useStoreState(
        ({ server }) => ({
            variables: server.data?.variables || [],
            invocation: server.data?.invocation || '',
            dockerImage: server.data?.dockerImage || '',
        }),
        isEqual,
    );

    const { data, mutate } = getServerStartup(uuid || '', {
        ...variables,
        dockerImages: { [variables.dockerImage]: variables.dockerImage },
        rawStartupCommand: variables.invocation,
    });

    useDeepCompareEffect(() => {
        if (!data) return;
        setServerFromState((s) => ({
            ...s,
            invocation: data.invocation,
            variables: data.variables,
        }));
    }, [data]);

    // Software-change backups are temporary 72h slots that replace the previous
    // one, so always opt-in when the user can create backups (even at limit).
    useEffect(() => {
        if (!canCreateBackups || backupLimit === 0) {
            setShouldBackup(false);
            return;
        }
        setShouldBackup(true);
    }, [canCreateBackups, backupLimit]);

    useEffect(() => {
        if (!canWipeFilesOption) {
            setShouldWipe(false);
        }
    }, [canWipeFilesOption]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showWipeConfirmation && wipeCountdown > 0) {
            interval = setInterval(() => {
                setWipeCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [showWipeConfirmation, wipeCountdown]);

    useEffect(() => {
        if (showWipeConfirmation) {
            setWipeCountdown(5);
        }
    }, [showWipeConfirmation]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.shiftKey) setShiftPressed(true);
        };
        const handleKeyUp = (event: KeyboardEvent) => {
            if (!event.shiftKey) setShiftPressed(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const resetFlow = () => {
        setCurrentStep('overview');
        setSelectedNest(null);
        setSelectedEgg(null);
        setEggPreview(null);
        setPendingVariables({});
        setVariableErrors({});
        setShouldBackup(canCreateBackups && backupLimit !== 0);
        setShouldWipe(false);
        setCustomStartup('');
        setSelectedDockerImage('');
        setSelectedMcjarsType(null);
    };

    const beginSoftwareChange = () => {
        setSelectedNest(null);
        setSelectedEgg(null);
        setEggPreview(null);
        setPendingVariables({});
        setVariableErrors({});
        setCustomStartup('');
        setSelectedDockerImage('');
        setSelectedMcjarsType(null);
        setCurrentStep('select-game');
    };

    const handleNestSelection = (nest: Nest) => {
        setSelectedNest(nest);
        setSelectedEgg(null);
        setEggPreview(null);
        setPendingVariables({});
        setVariableErrors({});
        setCustomStartup('');
        setSelectedDockerImage('');
        setSelectedMcjarsType(null);
        setCurrentStep('select-software');
    };

    const seedPreviewDefaults = (preview: EggPreview) => {
        const initialVariables: Record<string, string> = {};
        preview.variables.forEach((variable) => {
            const existingVar = data?.variables.find((v) => v.envVariable === variable.env_variable);
            initialVariables[variable.env_variable] = existingVar?.serverValue || variable.default_value || '';
        });
        setPendingVariables(initialVariables);
        setCustomStartup(preview.egg.startup);

        const availableDisplayNames = Object.keys(preview.docker_images || {});
        if (preview.default_docker_image && availableDisplayNames.includes(preview.default_docker_image)) {
            setSelectedDockerImage(preview.default_docker_image);
        } else if (availableDisplayNames.length > 0 && availableDisplayNames[0]) {
            setSelectedDockerImage(availableDisplayNames[0]);
        }
    };

    const handleEggSelection = async (egg: Egg, nest: Nest | null = selectedNest) => {
        if (!nest || !uuid) return;

        setIsLoading(true);
        setSelectedEgg(egg);

        try {
            const preview = await previewEggChange(uuid, egg.attributes.id, nest.attributes.id);
            setEggPreview(preview);

            if (preview.warnings && preview.warnings.length > 0) {
                const subdomainWarning = preview.warnings.find((w) => w.type === 'subdomain_incompatible');
                if (subdomainWarning) {
                    toast.error(subdomainWarning.message, {
                        duration: 8000,
                        dismissible: true,
                    });
                }
            }

            seedPreviewDefaults(preview);
            setVariableErrors({});

            // Minecraft MCJars eggs get the version picker; everything else uses
            // the official configure → review path.
            const mcType = isMinecraftNest(nest) ? eggNameToMcjarsType(egg.attributes.name) : null;
            setSelectedMcjarsType(mcType);
            setCurrentStep(mcType ? 'select-version' : 'configure');
        } catch (error) {
            console.error(error);
            toast.error(httpErrorToHuman(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGlobalEggSelection = (nest: Nest, egg: Egg) => {
        setSelectedNest(nest);
        setSelectedEgg(null);
        setEggPreview(null);
        setPendingVariables({});
        setVariableErrors({});
        setCustomStartup('');
        setSelectedDockerImage('');
        setSelectedMcjarsType(null);
        handleEggSelection(egg, nest);
    };

    const handleVersionInstall = (selection: { version: string; build: string; java: number | null }) => {
        if (!eggPreview) return;

        setPendingVariables((prev) => {
            const next = { ...prev };
            const names = new Set(eggPreview.variables.map((v) => v.env_variable));

            // Write the chosen MC version into every version-shaped egg var
            // (MINECRAFT_VERSION, VELOCITY_VERSION, VANILLA_VERSION, BUNGEE_VERSION, …).
            for (const name of names) {
                if (name === 'MC_VERSION' || name.endsWith('_VERSION')) {
                    next[name] = selection.version;
                }
            }

            if (names.has('BUILD_NUMBER') || 'BUILD_NUMBER' in next) {
                next.BUILD_NUMBER = selection.build;
            }
            if (names.has('SERVER_JARFILE') || 'SERVER_JARFILE' in next) {
                next.SERVER_JARFILE = next.SERVER_JARFILE || 'server.jar';
            }
            return next;
        });

        const image = pickJavaDockerImage(eggPreview.docker_images, selection.java);
        if (image) {
            setSelectedDockerImage(image);
        }

        setCurrentStep('review');
    };

    const handleVariableChange = (envVariable: string, value: string) => {
        setPendingVariables((prev) => ({
            ...prev,
            [envVariable]: value,
        }));
        setVariableErrors((prev) => {
            if (!(envVariable in prev)) return prev;
            const next = { ...prev };
            delete next[envVariable];
            return next;
        });
    };

    const applyChanges = async () => {
        if (!selectedEgg || !selectedNest || !eggPreview) return;

        if (!canApplyChanges) {
            toast.error(t('server.software.configuration.missing_permissions'));
            return;
        }

        if (shouldWipe && !shouldBackup) {
            setShowWipeConfirmation(true);
            return;
        }

        executeApplyChanges();
    };

    const executeApplyChanges = async () => {
        if (!selectedEgg || !selectedNest || !eggPreview || !uuid) return;

        setIsLoading(true);

        try {
            const validationErrors = validateEnvironmentVariables(eggPreview.variables, pendingVariables, t);

            if (validationErrors.length > 0) {
                throw new Error(`${t('server.software.validation.failed')}:\n${validationErrors.join('\n')}`);
            }

            const actualDockerImage =
                selectedDockerImage && eggPreview.docker_images
                    ? eggPreview.docker_images[selectedDockerImage]
                    : eggPreview.default_docker_image && eggPreview.docker_images
                      ? eggPreview.docker_images[eggPreview.default_docker_image]
                      : '';

            // Apply defaults for all viewable variables (including read-only defaults
            // like BUILD_NUMBER) — advanced editing UI is intentionally omitted.
            const filteredEnvironment: Record<string, string> = {};
            eggPreview.variables.forEach((variable) => {
                if (!variable.user_viewable) return;
                const value = pendingVariables[variable.env_variable];
                if (value && value.trim() !== '') {
                    filteredEnvironment[variable.env_variable] = value;
                }
            });

            if (!canReadStartup || !canUpdateStartup || !canChangeDockerImage || !canReinstall) {
                throw new Error(t('server.software.configuration.missing_permissions'));
            }

            if (shouldBackup && !canCreateBackups) {
                throw new Error(t('server.software.configuration.missing_backup_permission'));
            }

            if (shouldWipe && (!canReadFiles || !canDeleteFiles)) {
                throw new Error(t('server.software.configuration.missing_file_permission'));
            }

            const response = await applyEggChange(uuid, {
                egg_id: selectedEgg.attributes.id,
                nest_id: selectedNest.attributes.id,
                docker_image: actualDockerImage,
                startup_command: hasCustomStartup && canCustomizeStartup ? customStartup : undefined,
                environment: filteredEnvironment,
                should_backup: shouldBackup,
                should_wipe: shouldWipe,
            });

            rememberServerOperation(uuid, response.operation_id, 'egg_change');

            toast.success(t('server.software.operation_started'));

            resetFlow();
        } catch (error) {
            console.error('Failed to start egg change operation:', error);
            toast.error(httpErrorToHuman(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleWipeConfirm = () => {
        setShowWipeConfirmation(false);
        setWipeLoading(true);
        executeApplyChanges().finally(() => setWipeLoading(false));
    };

    useEffect(() => {
        if (!uuid) return;
        const onFinished = (event: Event) => {
            const detail = (event as CustomEvent).detail as { uuid?: string; type?: string };
            if (detail?.uuid === uuid && detail.type === 'egg_change') {
                mutate();
            }
        };
        window.addEventListener('hd:server-operation-finished', onFinished);
        return () => window.removeEventListener('hd:server-operation-finished', onFinished);
    }, [uuid, mutate]);

    const steps: FlowStep[] = selectedMcjarsType
        ? ['overview', 'select-game', 'select-software', 'select-version', 'review']
        : ['overview', 'select-game', 'select-software', 'configure', 'review'];
    const stepIndex = Math.max(0, steps.indexOf(currentStep));

    if (!serverData) {
        return (
            <div className='flex items-center justify-center h-64'>
                <div className='flex flex-col items-center text-center'>
                    <Spinner size='large' />
                    <p className='text-cream-400/70 mt-4'>{t('server.software.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <ServerContentBlock className='p-0!' title={t('server.software.title')} showFlashKey={'Software'}>
            <ServerHeader />
            <div className='px-2 pt-2 pb-6 sm:px-14 sm:pt-14'>
                <div className='space-y-6'>
                    <div className='relative'>
                        {currentStep !== 'overview' && (
                            <div className='absolute inset-x-0 top-0 z-10 h-1 overflow-hidden rounded-t-2xl bg-mocha-400'>
                                <div
                                    className='bg-brand h-full transition-all duration-300'
                                    style={{
                                        width: `${(stepIndex / Math.max(steps.length - 1, 1)) * 100}%`,
                                    }}
                                />
                            </div>
                        )}

                        {currentStep === 'overview' && (
                            <SoftwareOverview
                                currentEggName={currentEggName}
                                isLoading={isLoading}
                                onChangeSoftware={beginSoftwareChange}
                            />
                        )}
                        {currentStep === 'select-game' && (
                            <GameSelection
                                nests={nests || []}
                                isLoading={isLoading}
                                selectedEggUuid={selectedEgg?.attributes?.uuid}
                                onSelectNest={handleNestSelection}
                                onSelectSoftware={handleGlobalEggSelection}
                                onBack={() => setCurrentStep('overview')}
                            />
                        )}
                        {currentStep === 'select-software' && selectedNest && (
                            <SoftwareSelection
                                selectedNest={selectedNest}
                                isLoading={isLoading}
                                selectedEggUuid={selectedEgg?.attributes?.uuid}
                                flatMinecraft={isMinecraftNest(selectedNest)}
                                onSelectEgg={handleEggSelection}
                                onBack={() => setCurrentStep('select-game')}
                                onCancel={() => setCurrentStep('overview')}
                            />
                        )}
                        {currentStep === 'select-version' && selectedEgg && selectedMcjarsType && uuid && (
                            <VersionSelection
                                uuid={uuid}
                                egg={selectedEgg}
                                mcjarsType={selectedMcjarsType}
                                isLoading={isLoading}
                                onBack={() => setCurrentStep('select-software')}
                                onCancel={() => setCurrentStep('overview')}
                                onInstall={handleVersionInstall}
                            />
                        )}
                        {currentStep === 'configure' && selectedEgg && eggPreview && (
                            <SoftwareConfiguration
                                selectedEgg={selectedEgg}
                                eggPreview={eggPreview}
                                customStartup={customStartup}
                                canEditStartupCommand={canCustomizeStartup}
                                canCreateBackups={canCreateBackups}
                                canWipeFiles={canWipeFilesOption}
                                selectedDockerImage={selectedDockerImage}
                                pendingVariables={pendingVariables}
                                variableErrors={variableErrors}
                                shouldBackup={shouldBackup}
                                shouldWipe={shouldWipe}
                                backupLimit={backupLimit}
                                backupCount={backupCount}
                                onStartupChange={setCustomStartup}
                                onDockerImageChange={setSelectedDockerImage}
                                onVariableChange={handleVariableChange}
                                onBackupChange={setShouldBackup}
                                onWipeChange={setShouldWipe}
                                onBack={() => setCurrentStep('select-software')}
                                onReview={() => setCurrentStep('review')}
                            />
                        )}
                        {currentStep === 'review' && selectedEgg && selectedNest && eggPreview && (
                            <ReviewChanges
                                selectedEgg={selectedEgg}
                                selectedNest={selectedNest}
                                eggPreview={eggPreview}
                                currentEggName={currentEggName}
                                customStartup={customStartup}
                                selectedDockerImage={selectedDockerImage}
                                pendingVariables={pendingVariables}
                                shouldBackup={shouldBackup}
                                shouldWipe={shouldWipe}
                                isLoading={isLoading}
                                canApply={canApplyChanges}
                                blockedMessage={t('server.software.configuration.missing_permissions')}
                                onBackupChange={canCreateBackups && backupLimit !== 0 ? setShouldBackup : undefined}
                                onWipeChange={canWipeFilesOption ? setShouldWipe : undefined}
                                onBack={() => setCurrentStep(selectedMcjarsType ? 'select-version' : 'configure')}
                                onApply={applyChanges}
                            />
                        )}
                    </div>
                </div>
            </div>

            <WipeConfirmationModal
                visible={showWipeConfirmation}
                wipeCountdown={wipeCountdown}
                shiftPressed={shiftPressed}
                wipeLoading={wipeLoading}
                onConfirm={handleWipeConfirm}
                onDismiss={() => setShowWipeConfirmation(false)}
            />
        </ServerContentBlock>
    );
};

export default SoftwareContainer;
