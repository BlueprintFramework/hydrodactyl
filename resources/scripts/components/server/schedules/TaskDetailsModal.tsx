import { Form, Formik, Field as FormikField, type FormikHelpers, useField } from 'formik';
import { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { boolean, number, object, string } from 'yup';
import { httpErrorToHuman } from '@/api/http';
import createOrUpdateScheduleTask from '@/api/server/schedules/createOrUpdateScheduleTask';
import type { Schedule, Task } from '@/api/server/schedules/getServerSchedules';
import Field from '@/components/elements/Field';
import FormikFieldWrapper from '@/components/elements/FormikFieldWrapper';
import FormikSwitchV2 from '@/components/elements/FormikSwitchV2';
import { Textarea } from '@/components/elements/Input';
import Modal, { type RequiredModalProps } from '@/components/elements/Modal';
import Select from '@/components/elements/Select';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { Translate } from '@/i18n/types';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

// TODO: Port modern dropdowns to Formik and integrate them
// import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/elements/DropdownMenu';
// import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';

const Label = styled.label`
  display: inline-block;
  color: #ffffff77;
  font-size: 0.875rem;
  padding-bottom: 0.5rem;
`;

interface Props extends RequiredModalProps {
    schedule: Schedule;
    // If a task is provided we can assume we're editing it. If not provided,
    // we are creating a new one.
    task?: Task;
}

interface Values {
    action: string;
    payload: string;
    timeOffset: string;
    continueOnFailure: boolean;
}

const createSchema = (t: Translate) =>
    object().shape({
            action: string()
                .required(t('server.schedules.task.action_required'))
                .oneOf(['command', 'power', 'backup'], t('server.schedules.task.action_invalid')),
        payload: string().when('action', {
            is: (v) => v !== 'backup',
            // biome-ignore lint/suspicious/noThenProperty: yup's when() API uses `then` as property name
            then: () => string().required(t('server.schedules.task.payload_required')),
            otherwise: () => string(),
        }),
        continueOnFailure: boolean(),
        timeOffset: number()
            .typeError(t('server.schedules.task.time_offset_invalid'))
            .required(t('server.schedules.task.time_offset_required'))
            .min(0, t('server.schedules.task.time_offset_min'))
            .max(900, t('server.schedules.task.time_offset_max')),
    });

const ActionListener = () => {
    const [{ value }, { initialValue: initialAction }] = useField<string>('action');
    const [, { initialValue: initialPayload }, { setValue, setTouched }] = useField<string>('payload');

    useEffect(() => {
        if (value !== initialAction) {
            setValue(value === 'power' ? 'start' : '');
            setTouched(false);
        } else {
            setValue(initialPayload || '');
            setTouched(false);
        }
    }, [value, setValue, setTouched, initialPayload, initialAction]);

    return null;
};

export const completeTaskSubmission = (
    schedule: Schedule,
    savedTask: Task,
    setSubmitting: FormikHelpers<Values>['setSubmitting'],
    appendSchedule: (schedule: Schedule) => void,
    onDismissed: () => void,
) => {
    let tasks = schedule.tasks.map((task) => (task.id === savedTask.id ? savedTask : task));
    if (!schedule.tasks.some((task) => task.id === savedTask.id)) {
        tasks = [...tasks, savedTask];
    }

    setSubmitting(false);
    appendSchedule({ ...schedule, tasks });
    onDismissed();
};

const TaskDetailsModal = ({ schedule, task, visible, onDismissed, ...props }: Props) => {
    const { clearFlashes, addError } = useFlash();
    const { t } = useTranslation();

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const backupLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.backups);

    const schema = useMemo(() => createSchema(t), [t]);

    useEffect(() => {
        clearFlashes('schedule:task');
    }, [clearFlashes]);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:task');
        if (backupLimit === 0 && values.action === 'backup') {
            setSubmitting(false);
            addError({
                message: t('server.schedules.task.backup_limit_error'),
                key: 'schedule:task',
            });
        } else {
            createOrUpdateScheduleTask(uuid, schedule.id, task?.id, values)
                .then((savedTask) =>
                    completeTaskSubmission(schedule, savedTask, setSubmitting, appendSchedule, onDismissed),
                )
                .catch((error) => {
                    console.error(error);
                    setSubmitting(false);
                    addError({ message: httpErrorToHuman(error), key: 'schedule:task' });
                });
        }
    };

    return (
        <Formik
            onSubmit={submit}
            validationSchema={schema}
            initialValues={{
                action: task?.action || 'command',
                payload: task?.payload || '',
                timeOffset: task?.timeOffset.toString() || '0',
                continueOnFailure: task?.continueOnFailure || false,
            }}
        >
            {({ isSubmitting, values }) => (
                <Modal
                    visible={visible}
                    onDismissed={onDismissed}
                    {...props}
                    showSpinnerOverlay={isSubmitting}
                    title={task ? t('server.schedules.task.edit_title') : t('server.schedules.task.create_title')}
                >
                    <Form>
                        <FlashMessageRender byKey={'schedule:task'} />
                        <div className={`flex flex-col gap-3`}>
                            <div>
                                <Label>{t('server.schedules.task.action_label')}</Label>
                                <ActionListener />
                                <FormikFieldWrapper name={'action'}>
                                    <FormikField
                                        className='px-4 py-2 bg-[#ffffff11] rounded-lg min-w-full'
                                        as={Select}
                                        name={'action'}
                                    >
                                        <option className='bg-black' value={'command'}>
                                            {t('server.schedules.task.action_command')}
                                        </option>
                                        <option className='bg-black' value={'power'}>
                                            {t('server.schedules.task.action_power')}
                                        </option>
                                        <option className='bg-black' value={'backup'}>
                                            {t('server.schedules.task.action_backup')}
                                        </option>
                                    </FormikField>
                                </FormikFieldWrapper>
                            </div>
                            <div>
                                <Field
                                    name={'timeOffset'}
                                    label={t('server.schedules.task.time_offset_label')}
                                    description={t('server.schedules.task.time_offset_description')}
                                />
                            </div>
                        </div>
                        <div className={`my-6`}>
                            {values.action === 'command' ? (
                                <div>
                                    <Label>{t('server.schedules.task.payload_label')}</Label>
                                    <FormikFieldWrapper name={'payload'}>
                                        <FormikField
                                            className='w-full rounded-xl p-2 bg-[#ffffff11]'
                                            as={Textarea}
                                            name={'payload'}
                                            rows={6}
                                        />
                                    </FormikFieldWrapper>
                                </div>
                            ) : values.action === 'power' ? (
                                <div>
                                    <Label>{t('server.schedules.task.payload_label')}</Label>
                                    <FormikFieldWrapper name={'payload'}>
                                        <FormikField
                                            className='px-4 py-2 bg-[#ffffff11] rounded-lg min-w-full'
                                            as={Select}
                                            name={'payload'}
                                        >
                                            <option className='bg-black' value={'start'}>
                                                {t('server.schedules.task.power_start')}
                                            </option>
                                            <option className='bg-black' value={'restart'}>
                                                {t('server.schedules.task.power_restart')}
                                            </option>
                                            <option className='bg-black' value={'stop'}>
                                                {t('server.schedules.task.power_stop')}
                                            </option>
                                            <option className='bg-black' value={'kill'}>
                                                {t('server.schedules.task.power_kill')}
                                            </option>
                                        </FormikField>
                                    </FormikFieldWrapper>
                                </div>
                            ) : (
                                <div>
                                    <Label>{t('server.schedules.task.ignored_files_label')}</Label>
                                    <FormikFieldWrapper
                                        name={'payload'}
                                        description={t('server.schedules.task.ignored_files_description')}
                                    >
                                        <FormikField
                                            className='w-full rounded-2xl bg-[#ffffff11]'
                                            as={Textarea}
                                            name={'payload'}
                                            rows={6}
                                        />
                                    </FormikFieldWrapper>
                                </div>
                            )}
                        </div>
                        <FormikSwitchV2
                            name={'continueOnFailure'}
                            description={t('server.schedules.task.continue_on_failure_description')}
                            label={t('server.schedules.task.continue_on_failure_label')}
                        />
                        <div className={`flex justify-end my-6`}>
                            <Button variant='attention' type={'submit'} disabled={isSubmitting}>
                                {task ? t('server.schedules.save_changes') : t('server.schedules.task.create_title')}
                            </Button>
                        </div>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default TaskDetailsModal;
