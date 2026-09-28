import { useEffect, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { toast } from 'sonner';
import { httpErrorToHuman } from '@/api/http';
import getNests from '@/api/nests/getNests';
import applyEggChange from '@/api/server/applyEggChange';
import applyEggChangeSync from '@/api/server/applyEggChangeSync';
import { getGlobalDaemonType } from '@/api/server/getServer';
import previewEggChange, { type EggPreview } from '@/api/server/previewEggChange';
import type { ServerOperation } from '@/api/server/serverOperations';
import getServerBackups from '@/api/swr/getServerBackups';
import getServerStartup from '@/api/swr/getServerStartup';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import ServerHeader from '@/components/server/header/ServerHeader';
import OperationProgressModal from '@/components/server/operations/OperationProgressModal';
import WingsOperationProgressModal from '@/components/server/operations/WingsOperationProgressModal';
import { useTranslation } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/types';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import { ServerContext } from '@/state/server';
import GameSelection from './GameSelection';
import ReviewChanges from './ReviewChanges';
import SoftwareConfiguration from './SoftwareConfiguration';
import SoftwareOverview from './SoftwareOverview';
import SoftwareSelection from './SoftwareSelection';
import type { Egg, FlowStep, Nest } from './types';
import { validateEnvironmentVariables } from './types';
import WipeConfirmationModal from './WipeConfirmationModal';

const STEP_LABELS: Record<FlowStep, TranslationKey> = {
    overview: 'server.software.steps.overview',
    'select-game': 'server.software.steps.select_game',
    'select-software': 'server.software.steps.select_software',
    configure: 'server.software.steps.configure',
    review: 'server.software.steps.review',
};

const SoftwareContainer = () => {
    const { t } = useTranslation();
    const serverData = ServerContext.useStoreState((state) => state.server.data);
    const daemonType = getGlobalDaemonType();
    const uuid = serverData?.uuid;
    const [nests, setNests] = useState<Nest[]>();
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

    const { data: backups } = getServerBackups();
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    const [currentStep, setCurrentStep] = useState<FlowStep>('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedNest, setSelectedNest] = useState<Nest | null>(null);
    const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
    const [eggPreview, setEggPreview] = useState<EggPreview | null>(null);
    const [pendingVariables, setPendingVariables] = useState<Record<string, string>>({});
    const [variableErrors, setVariableErrors] = useState<Record<string, string>>({});
    const [currentOperationId, setCurrentOperationId] = useState<string | null>(null);
    const [showOperationModal, setShowOperationModal] = useState(false);
    const [showWipeConfirmation, setShowWipeConfirmation] = useState(false);
    const [wipeCountdown, setWipeCountdown] = useState(5);
    const [wipeLoading, setWipeLoading] = useState(false);
    const [shiftPressed, setShiftPressed] = useState(false);

    const [shouldBackup, setShouldBackup] = useState(false);
    const [shouldWipe, setShouldWipe] = useState(false);

    const [customStartup, setCustomStartup] = useState('');
    const [selectedDockerImage, setSelectedDockerImage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const data = await getNests();
            setNests(data);
        };
        fetchData();
    }, []);

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

    useEffect(() => {
        if (backups) {
            setShouldBackup(backupLimit !== 0 && (backupLimit === null || backups.backupCount < backupLimit));
        }
    }, [backups, backupLimit]);

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
        setShouldBackup(backupLimit !== 0 && (backupLimit === null || (backups?.backupCount || 0) < backupLimit));
        setShouldWipe(false);
        setCustomStartup('');
        setSelectedDockerImage('');
    };

    const handleNestSelection = (nest: Nest) => {
        setSelectedNest(nest);
        setSelectedEgg(null);
        setEggPreview(null);
        setPendingVariables({});
        setVariableErrors({});
        setCustomStartup('');
        setSelectedDockerImage('');
        setCurrentStep('select-software');
    };

    const handleEggSelection = async (egg: Egg) => {
        if (!selectedNest || !uuid) return;

        setIsLoading(true);
        setSelectedEgg(egg);

        try {
            const preview = await previewEggChange(uuid, egg.attributes.id, selectedNest.attributes.id);
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

            setCurrentStep('configure');
        } catch (error) {
            console.error(error);
            toast.error(httpErrorToHuman(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVariableChange = (envVariable: string, value: string) => {
        setPendingVariables((prev) => ({ ...prev, [envVariable]: value }));

        if (eggPreview) {
            const variable = eggPreview.variables.find((v) => v.env_variable === envVariable);
            if (variable) {
                const errors = validateEnvironmentVariables(
                    [variable],
                    {
                        [envVariable]: value,
                    },
                    t,
                );
                setVariableErrors((prev) => {
                    const newErrors = { ...prev };
                    if (errors.length > 0 && errors[0]) {
                        newErrors[envVariable] = errors[0];
                    } else {
                        delete newErrors[envVariable];
                    }
                    return newErrors;
                });
            }
        }
    };

    const proceedToReview = () => {
        setCurrentStep('review');
    };

    const applyChanges = async () => {
        if (!selectedEgg || !selectedNest || !eggPreview) return;

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

            const filteredEnvironment: Record<string, string> = {};
            Object.entries(pendingVariables).forEach(([key, value]) => {
                if (value && value.trim() !== '') {
                    filteredEnvironment[key] = value;
                }
            });

            if (daemonType?.toLowerCase() === 'elytra') {
                const response = await applyEggChange(uuid, {
                    egg_id: selectedEgg.attributes.id,
                    nest_id: selectedNest.attributes.id,
                    docker_image: actualDockerImage,
                    startup_command: customStartup,
                    environment: filteredEnvironment,
                    should_backup: shouldBackup,
                    should_wipe: shouldWipe,
                });

                setCurrentOperationId(response.operation_id);
                setShowOperationModal(true);
            } else if (daemonType?.toLowerCase() === 'wings') {
                await applyEggChangeSync(uuid, {
                    egg_id: selectedEgg.attributes.id,
                    nest_id: selectedNest.attributes.id,
                    docker_image: actualDockerImage,
                    startup_command: customStartup,
                    environment: filteredEnvironment,
                    should_backup: shouldBackup,
                    should_wipe: shouldWipe,
                });
            }

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

    const handleOperationComplete = (operation: ServerOperation) => {
        if (operation.is_completed) {
            toast.success(t('server.software.operation_success'));
            mutate();
        } else if (operation.has_failed) {
            toast.error(operation.message || t('server.software.operation_failed'));
        }
    };

    const handleOperationError = (error: Error) => {
        toast.error(error.message || t('server.software.operation_monitor_error'));
    };

    const closeOperationModal = () => {
        setShowOperationModal(false);
        setCurrentOperationId(null);
    };

    const steps = ['overview', 'select-game', 'select-software', 'configure', 'review'] as FlowStep[];

    if (!serverData) {
        return (
            <ServerContentBlock title={t('server.software.title')}>
                <div className='flex items-center justify-center h-64'>
                    <div className='flex flex-col items-center text-center'>
                        <Spinner size='large' />
                        <p className='text-neutral-400 mt-4'>{t('server.software.loading')}</p>
                    </div>
                </div>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={t('server.software.title')}>
            <ServerHeader />
            <div className='space-y-6'>
                <MainPageHeader direction='column' title={t('server.software.title')}>
                    <p className='text-neutral-400 leading-relaxed'>{t('server.software.description')}</p>
                </MainPageHeader>

                {currentStep !== 'overview' && (
                    <div className='p-4 bg-[#ffffff08] border border-[#ffffff12] rounded-lg'>
                        <div className='flex items-center justify-between mb-2'>
                            <span className='text-sm font-medium text-neutral-200'>{t(STEP_LABELS[currentStep])}</span>
                            <span className='text-sm text-neutral-400'>
                                {t('server.software.step_indicator', { step: steps.indexOf(currentStep), total: 4 })}
                            </span>
                        </div>
                        <div className='w-full bg-[#ffffff12] rounded-full h-2'>
                            <div
                                className='bg-brand h-2 rounded-full transition-all duration-300'
                                style={{
                                    width: `${(steps.indexOf(currentStep) / 4) * 100}%`,
                                }}
                            ></div>
                        </div>
                    </div>
                )}

                {currentStep === 'overview' && (
                    <SoftwareOverview
                        currentEggName={currentEggName}
                        isLoading={isLoading}
                        onChangeSoftware={() => setCurrentStep('select-game')}
                    />
                )}
                {currentStep === 'select-game' && (
                    <GameSelection
                        nests={nests || []}
                        onSelectNest={handleNestSelection}
                        onBack={() => setCurrentStep('overview')}
                    />
                )}
                {currentStep === 'select-software' && selectedNest && (
                    <SoftwareSelection
                        selectedNest={selectedNest}
                        isLoading={isLoading}
                        selectedEggUuid={selectedEgg?.attributes?.uuid}
                        onSelectEgg={handleEggSelection}
                        onBack={() => setCurrentStep('select-game')}
                        onCancel={() => setCurrentStep('overview')}
                    />
                )}
                {currentStep === 'configure' && selectedEgg && eggPreview && (
                    <SoftwareConfiguration
                        selectedEgg={selectedEgg}
                        eggPreview={eggPreview}
                        customStartup={customStartup}
                        selectedDockerImage={selectedDockerImage}
                        pendingVariables={pendingVariables}
                        variableErrors={variableErrors}
                        shouldBackup={shouldBackup}
                        shouldWipe={shouldWipe}
                        backupLimit={backupLimit}
                        backupCount={backups?.backupCount || 0}
                        onStartupChange={setCustomStartup}
                        onDockerImageChange={setSelectedDockerImage}
                        onVariableChange={handleVariableChange}
                        onBackupChange={setShouldBackup}
                        onWipeChange={setShouldWipe}
                        onBack={() => setCurrentStep('select-software')}
                        onReview={proceedToReview}
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
                        onBack={() => setCurrentStep('configure')}
                        onApply={applyChanges}
                    />
                )}
            </div>

            <WipeConfirmationModal
                visible={showWipeConfirmation}
                wipeCountdown={wipeCountdown}
                shiftPressed={shiftPressed}
                wipeLoading={wipeLoading}
                onConfirm={handleWipeConfirm}
                onDismiss={() => setShowWipeConfirmation(false)}
            />

            {daemonType === 'elytra' && (
                <OperationProgressModal
                    visible={showOperationModal}
                    operationId={currentOperationId}
                    operationType={t('server.software.operation_type')}
                    onClose={closeOperationModal}
                    onComplete={handleOperationComplete}
                    onError={handleOperationError}
                />
            )}
            {daemonType === 'wings' && (
                <WingsOperationProgressModal
                    visible={showOperationModal}
                    operationId={currentOperationId}
                    operationType={t('server.software.operation_type')}
                    onClose={closeOperationModal}
                    onComplete={handleOperationComplete}
                    onError={handleOperationError}
                />
            )}
            {daemonType !== 'elytra' && daemonType !== 'wings' && (
                <div>{t('server.software.operation_modal_missing', { daemon: daemonType ?? '' })}</div>
            )}
        </ServerContentBlock>
    );
};

export default SoftwareContainer;
