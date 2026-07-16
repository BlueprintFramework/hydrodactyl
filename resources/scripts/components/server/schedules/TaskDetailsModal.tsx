import { Form, Formik, Field as FormikField, type FormikHelpers, useField } from 'formik';
import { useEffect } from 'react';
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

const schema = object().shape({
    action: string().required().oneOf(['command', 'power', 'backup']),
    payload: string().when('action', {
        is: (v) => v !== 'backup',
        // biome-ignore lint/suspicious/noThenProperty: yup's when() API uses `then` as property name
        then: () => string().required('A task payload must be provided.'),
        otherwise: () => string(),
    }),
    continueOnFailure: boolean(),
    timeOffset: number()
        .typeError('The time offset must be a valid number between 0 and 900.')
        .required('A time offset value must be provided.')
        .min(0, 'The time offset must be at least 0 seconds.')
        .max(900, 'The time offset must be less than 900 seconds.'),
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

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const backupLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.backups);

    useEffect(() => {
        clearFlashes('schedule:task');
    }, [clearFlashes]);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:task');
        if (backupLimit === 0 && values.action === 'backup') {
            setSubmitting(false);
            addError({
                message: "A backup task cannot be created when the server's backup limit is set to 0.",
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
                    title={task ? 'Edit Task' : 'Create Task'}
                >
                    <Form>
                        <FlashMessageRender byKey={'schedule:task'} />
                        <div className={`flex flex-col gap-3`}>
                            <div>
                                <Label>Action</Label>
                                <ActionListener />
                                <FormikFieldWrapper name={'action'}>
                                    <FormikField
                                        className='px-4 py-2 bg-[#ffffff11] rounded-lg min-w-full'
                                        as={Select}
                                        name={'action'}
                                    >
                                        <option className='bg-black' value={'command'}>
                                            Send command
                                        </option>
                                        <option className='bg-black' value={'power'}>
                                            Power
                                        </option>
                                        <option className='bg-black' value={'backup'}>
                                            Create backup
                                        </option>
                                    </FormikField>
                                </FormikFieldWrapper>
                            </div>
                            <div>
                                <Field
                                    name={'timeOffset'}
                                    label={'Time offset (in seconds)'}
                                    description={
                                        'The amount of time to wait after the previous task executes before running this one. If this is the first task on a schedule this will not be applied.'
                                    }
                                />
                            </div>
                        </div>
                        <div className={`my-6`}>
                            {values.action === 'command' ? (
                                <div>
                                    <Label>Payload</Label>
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
                                    <Label>Payload</Label>
                                    <FormikFieldWrapper name={'payload'}>
                                        <FormikField
                                            className='px-4 py-2 bg-[#ffffff11] rounded-lg min-w-full'
                                            as={Select}
                                            name={'payload'}
                                        >
                                            <option className='bg-black' value={'start'}>
                                                Start the server
                                            </option>
                                            <option className='bg-black' value={'restart'}>
                                                Restart the server
                                            </option>
                                            <option className='bg-black' value={'stop'}>
                                                Stop the server
                                            </option>
                                            <option className='bg-black' value={'kill'}>
                                                Terminate the server
                                            </option>
                                        </FormikField>
                                    </FormikFieldWrapper>
                                </div>
                            ) : (
                                <div>
                                    <Label>Ignored files (optional)</Label>
                                    <FormikFieldWrapper
                                        name={'payload'}
                                        description={
                                            'Include the files and folders to be excluded in this backup. By default, the contents of your .pteroignore file will be used. If you have reached your backup limit, the oldest backup will be rotated.'
                                        }
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
                            description={'Future tasks will be run if this task fails.'}
                            label={'Continue on Failure'}
                        />
                        <div className={`flex justify-end my-6`}>
                            <Button variant='attention' type={'submit'} disabled={isSubmitting}>
                                {task ? 'Save Changes' : 'Create Task'}
                            </Button>
                        </div>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default TaskDetailsModal;
