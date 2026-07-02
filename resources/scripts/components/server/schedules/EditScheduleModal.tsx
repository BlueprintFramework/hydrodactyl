import { TZDate } from '@date-fns/tz';

import { toString } from 'cronstrue';
import { format } from 'date-fns';
import { useStoreState } from 'easy-peasy';
import { Form, Formik, type FormikHelpers } from 'formik';
import { useEffect, useMemo } from 'react';
import { httpErrorToHuman } from '@/api/http';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import type { Schedule } from '@/api/server/schedules/getServerSchedules';
import Field from '@/components/elements/Field';
import FormikSwitchV2 from '@/components/elements/FormikSwitchV2';
import Modal, { type RequiredModalProps } from '@/components/elements/Modal';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface Props extends RequiredModalProps {
    schedule?: Schedule;
}

interface Values {
    name: string;
    dayOfWeek: string;
    month: string;
    dayOfMonth: string;
    hour: string;
    minute: string;
    enabled: boolean;
    onlyWhenOnline: boolean;
}

const getTimezoneInfo = (serverTimezone: string) => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();

    const userOffsetString = format(now, 'xxx');
    let serverOffsetString: string;
    let offsetDifferenceMinutes = 0;

    let isServerTimezoneValid = true;
    try {
        const serverDate = new TZDate(now, serverTimezone);
        const userDate = new TZDate(now, userTimezone);
        serverOffsetString = format(serverDate, 'xxx');

        // offset difference in minutes
        const serverOffsetValue = serverDate.getTimezoneOffset();
        const userOffsetValue = userDate.getTimezoneOffset();

        // + values mean behind UTC
        // - values mean ahead of UTC
        offsetDifferenceMinutes = userOffsetValue - serverOffsetValue;
    } catch {
        serverOffsetString = 'Unknown';
        isServerTimezoneValid = false;
    }

    let differenceDescription = '';
    if (!isServerTimezoneValid) {
        differenceDescription = 'at an unknown difference to';
    } else if (offsetDifferenceMinutes === 0) {
        differenceDescription = 'same time';
    } else {
        const offsetDifferenceHours = offsetDifferenceMinutes / 60;
        const absDifferenceHours = Math.abs(offsetDifferenceHours);
        const isAhead = offsetDifferenceMinutes > 0;

        if (absDifferenceHours === Math.floor(absDifferenceHours)) {
            // whole hours
            differenceDescription = `${absDifferenceHours} hour${absDifferenceHours !== 1 ? 's' : ''} ${isAhead ? 'ahead of' : 'behind'}`;
        } else {
            // hours & minutes
            const hours = Math.floor(absDifferenceHours);
            const minutes = Math.abs(offsetDifferenceMinutes % 60);

            if (hours > 0) {
                differenceDescription = `${hours}h ${minutes}m ${isAhead ? 'ahead of' : 'behind'}`;
            } else {
                differenceDescription = `${minutes} minute${minutes !== 1 ? 's' : ''} ${isAhead ? 'ahead of' : 'behind'}`;
            }
        }
    }

    return {
        user: { timezone: userTimezone, offset: userOffsetString },
        server: { timezone: serverTimezone, offset: serverOffsetString },
        difference: differenceDescription,
        isDifferent: userTimezone !== serverTimezone,
    };
};

const formatTimezoneDisplay = (timezone: string, offset: string) => {
    return `${timezone} (${offset})`;
};

const getCronDescription = (
    minute: string,
    hour: string,
    dayOfMonth: string,
    month: string,
    dayOfWeek: string,
): string => {
    try {
        // Build cron expression: minute hour dayOfMonth month dayOfWeek
        const cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
        const description = toString(cronExpression, {
            throwExceptionOnParseError: false,
            verbose: true,
        });

        // Check if cronstrue returned an error message
        if (
            description ===
            'An error occurred when generating the expression description. Check the cron expression syntax.'
        ) {
            return 'Invalid cron expression';
        }

        return description;
    } catch {
        return 'Invalid cron expression.';
    }
};

const EditScheduleModal = ({ schedule, visible, onDismissed, ...props }: Props) => {
    const { addError, clearFlashes } = useFlash();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const serverTimezone = useStoreState((state) => state.settings.data?.timezone || 'Unknown');

    const timezoneInfo = useMemo(() => {
        return getTimezoneInfo(serverTimezone);
    }, [serverTimezone]);

    useEffect(() => {
        clearFlashes('schedule:edit');
    }, [clearFlashes]);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:edit');
        createOrUpdateSchedule(uuid, {
            id: schedule?.id,
            name: values.name,
            cron: {
                minute: values.minute,
                hour: values.hour,
                dayOfWeek: values.dayOfWeek,
                month: values.month,
                dayOfMonth: values.dayOfMonth,
            },
            onlyWhenOnline: values.onlyWhenOnline,
            isActive: values.enabled,
        })
            .then((schedule) => {
                setSubmitting(false);
                appendSchedule(schedule);
                onDismissed();
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                addError({ key: 'schedule:edit', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={
                {
                    name: schedule?.name || '',
                    minute: schedule?.cron.minute || '*/5',
                    hour: schedule?.cron.hour || '*',
                    dayOfMonth: schedule?.cron.dayOfMonth || '*',
                    month: schedule?.cron.month || '*',
                    dayOfWeek: schedule?.cron.dayOfWeek || '*',
                    enabled: schedule?.isActive ?? true,
                    onlyWhenOnline: schedule?.onlyWhenOnline ?? true,
                } as Values
            }
        >
            {({ isSubmitting, values }) => {
                const cronDescription = getCronDescription(
                    values.minute,
                    values.hour,
                    values.dayOfMonth,
                    values.month,
                    values.dayOfWeek,
                );

                return (
                    <Modal
                        visible={visible}
                        onDismissed={onDismissed}
                        {...props}
                        showSpinnerOverlay={isSubmitting}
                        title={schedule ? 'Edit schedule' : 'Create new schedule'}
                    >
                        <Form>
                            <FlashMessageRender byKey={'schedule:edit'} />
                            <Field
                                name={'name'}
                                label={'Schedule name'}
                                description={'A human readable identifier for this schedule.'}
                            />
                            <div className={`grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6`}>
                                <Field name={'minute'} label={'Minute'} />
                                <Field name={'hour'} label={'Hour'} />
                                <Field name={'dayOfWeek'} label={'Day of week'} />
                                <Field name={'dayOfMonth'} label={'Day of month'} />
                                <Field name={'month'} label={'Month'} />
                            </div>
                            <a href='https://crontab.guru/' target='_blank' rel='noreferrer' className='text-zinc-500 text-xs hover:text-zinc-300 transition-colors'>
                                Need help with cron syntax? Use Crontab Guru
                            </a>

                            <div className={`mt-1 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50`}>
                                <p className={`text-sm text-zinc-200 font-medium`}>{cronDescription}</p>
                            </div>

                            <p className={`text-zinc-400 text-xs mt-2`}>
                                The schedule system uses Cronjob syntax when defining when tasks should begin running.
                                Use the fields above to specify when these tasks should begin running.
                            </p>

                            {timezoneInfo.isDifferent && (
                                <p className={'text-zinc-500 text-xs my-2'}>
                                    Times are in server timezone ({formatTimezoneDisplay(timezoneInfo.server.timezone, timezoneInfo.server.offset)})
                                    {timezoneInfo.difference !== 'same time' && (
                                        <> — the server is {timezoneInfo.difference} your timezone</>
                                    )}
                                </p>
                            )}

                            <div className='my-3'>
                                <FormikSwitchV2
                                    name={'onlyWhenOnline'}
                                    description={'Only execute this schedule when the server is running.'}
                                    label={'Only When Server Is Online'}
                                />
                                <FormikSwitchV2
                                    name={'enabled'}
                                    description={'This schedule will be executed automatically if enabled.'}
                                    label={'Schedule Enabled'}
                                />
                            </div>
                            <div className={`mb-6 text-right`}>
                                <Button
                                    variant='attention'
                                    className={'w-full sm:w-auto'}
                                    type={'submit'}
                                    disabled={isSubmitting}
                                >
                                    {schedule ? 'Save changes' : 'Create schedule'}
                                </Button>
                            </div>
                        </Form>
                    </Modal>
                );
            }}
        </Formik>
    );
};

export default EditScheduleModal;
