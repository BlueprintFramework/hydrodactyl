import { TZDate } from '@date-fns/tz';
import cronstrue from 'cronstrue/i18n';
import { format, type Locale } from 'date-fns';
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
import { useTranslation } from '@/i18n/I18nProvider';
import { getCronstrueLocale } from '@/i18n/loader';
import type { Translate } from '@/i18n/types';
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

const getTimezoneInfo = (serverTimezone: string, t: Translate, dateFnsLocale: Locale) => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();

    const userOffsetString = format(now, 'xxx', { locale: dateFnsLocale });
    let serverOffsetString: string;
    let offsetDifferenceMinutes = 0;

    let isServerTimezoneValid = true;
    try {
        const serverDate = new TZDate(now, serverTimezone);
        const userDate = new TZDate(now, userTimezone);
        serverOffsetString = format(serverDate, 'xxx', { locale: dateFnsLocale });

        // offset difference in minutes
        const serverOffsetValue = serverDate.getTimezoneOffset();
        const userOffsetValue = userDate.getTimezoneOffset();

        // + values mean behind UTC
        // - values mean ahead of UTC
        offsetDifferenceMinutes = userOffsetValue - serverOffsetValue;
    } catch {
        serverOffsetString = t('common.unknown');
        isServerTimezoneValid = false;
    }

    let differenceDescription = '';
    let hasDifference = false;
    if (!isServerTimezoneValid) {
        differenceDescription = t('server.schedules.timezone.unknown_difference');
        hasDifference = true;
    } else if (offsetDifferenceMinutes !== 0) {
        hasDifference = true;

        const offsetDifferenceHours = offsetDifferenceMinutes / 60;
        const absDifferenceHours = Math.abs(offsetDifferenceHours);
        const isAhead = offsetDifferenceMinutes > 0;

        if (absDifferenceHours === Math.floor(absDifferenceHours)) {
            // whole hours
            const wholeHourKey = isAhead
                ? absDifferenceHours === 1
                    ? 'server.schedules.timezone.ahead_one'
                    : 'server.schedules.timezone.ahead_other'
                : absDifferenceHours === 1
                  ? 'server.schedules.timezone.behind_one'
                  : 'server.schedules.timezone.behind_other';

            differenceDescription = t(wholeHourKey, { count: absDifferenceHours });
        } else {
            // hours & minutes
            const hours = Math.floor(absDifferenceHours);
            const minutes = Math.abs(offsetDifferenceMinutes % 60);

            if (hours > 0) {
                differenceDescription = t(
                    isAhead
                        ? 'server.schedules.timezone.hours_minutes_ahead'
                        : 'server.schedules.timezone.hours_minutes_behind',
                    { hours, minutes },
                );
            } else {
                const minuteKey = isAhead
                    ? minutes === 1
                        ? 'server.schedules.timezone.minutes_ahead_one'
                        : 'server.schedules.timezone.minutes_ahead_other'
                    : minutes === 1
                      ? 'server.schedules.timezone.minutes_behind_one'
                      : 'server.schedules.timezone.minutes_behind_other';

                differenceDescription = t(minuteKey, { count: minutes });
            }
        }
    }

    return {
        user: { timezone: userTimezone, offset: userOffsetString },
        server: { timezone: serverTimezone, offset: serverOffsetString },
        difference: differenceDescription,
        isDifferent: userTimezone !== serverTimezone,
        hasDifference,
    };
};

const formatTimezoneDisplay = (timezone: string, offset: string) => {
    return `${timezone} (${offset})`;
};

const getCronDescription = (
    t: Translate,
    locale: string,
    minute: string,
    hour: string,
    dayOfMonth: string,
    month: string,
    dayOfWeek: string,
): string => {
    try {
        // Build cron expression: minute hour dayOfMonth month dayOfWeek
        const cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
        const options = {
            throwExceptionOnParseError: false,
            verbose: true,
            locale,
        };

        const description = cronstrue.toString(cronExpression, options);

        // cronstrue returns the same localized parse-error message for any
        // invalid expression; detect it without hardcoding English copy.
        if (description === cronstrue.toString('invalid', options)) {
            return t('server.schedules.cron.invalid');
        }

        return description;
    } catch {
        return t('server.schedules.cron.invalid_period');
    }
};

const EditScheduleModal = ({ schedule, visible, onDismissed, ...props }: Props) => {
    const { addError, clearFlashes } = useFlash();
    const { t, locale, dateFnsLocale } = useTranslation();

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const storedTimezone = useStoreState((state) => state.settings.data?.timezone);
    const serverTimezone = storedTimezone || t('common.unknown');

    const timezoneInfo = useMemo(() => {
        return getTimezoneInfo(serverTimezone, t, dateFnsLocale);
    }, [serverTimezone, t, dateFnsLocale]);

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
                    t,
                    getCronstrueLocale(locale),
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
                        title={schedule ? t('server.schedules.edit_title') : t('server.schedules.create_title')}
                    >
                        <Form>
                            <FlashMessageRender byKey={'schedule:edit'} />
                            <Field
                                name={'name'}
                                label={t('server.schedules.name_label')}
                                description={t('server.schedules.name_description')}
                            />
                            <div className={`grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 [&_label]:min-h-10`}>
                                <Field name={'minute'} label={t('server.schedules.cron.minute')} />
                                <Field name={'hour'} label={t('server.schedules.cron.hour')} />
                                <Field name={'dayOfWeek'} label={t('server.schedules.field_day_of_week')} />
                                <Field name={'dayOfMonth'} label={t('server.schedules.field_day_of_month')} />
                                <Field name={'month'} label={t('server.schedules.cron.month')} />
                            </div>
                            <a
                                href='https://crontab.guru/'
                                target='_blank'
                                rel='noreferrer'
                                className='text-zinc-500 text-xs hover:text-zinc-300 transition-colors'
                            >
                                {t('server.schedules.cron_help')}
                            </a>

                            <div className={`mt-1 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50`}>
                                <p className={`text-sm text-zinc-200 font-medium`}>{cronDescription}</p>
                            </div>

                            <p className={`text-zinc-400 text-xs mt-2`}>
                                {t('server.schedules.cron_syntax_description')}
                            </p>

                            {timezoneInfo.isDifferent && (
                                <p className={'text-zinc-500 text-xs my-2'}>
                                    {t('server.schedules.timezone.notice', {
                                        timezone: formatTimezoneDisplay(
                                            timezoneInfo.server.timezone,
                                            timezoneInfo.server.offset,
                                        ),
                                    })}
                                    {timezoneInfo.hasDifference && (
                                        <>
                                            {' '}
                                            {t('server.schedules.timezone.difference_suffix', {
                                                difference: timezoneInfo.difference,
                                            })}
                                        </>
                                    )}
                                </p>
                            )}

                            <div className='my-3'>
                                <FormikSwitchV2
                                    name={'onlyWhenOnline'}
                                    description={t('server.schedules.only_when_online_description')}
                                    label={t('server.schedules.only_when_online_label')}
                                />
                                <FormikSwitchV2
                                    name={'enabled'}
                                    description={t('server.schedules.enabled_description')}
                                    label={t('server.schedules.enabled_label')}
                                />
                            </div>
                            <div className={`mb-6 text-right`}>
                                <Button
                                    variant='attention'
                                    className={'w-full sm:w-auto'}
                                    type={'submit'}
                                    disabled={isSubmitting}
                                >
                                    {schedule ? t('server.schedules.save_changes') : t('server.schedules.create')}
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
