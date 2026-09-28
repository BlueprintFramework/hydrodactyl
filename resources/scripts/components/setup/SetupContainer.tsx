import { Form, Formik, type FormikHelpers } from 'formik';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { object, string } from 'yup';

import setupAdmin from '@/api/auth/setup';
import Field from '@/components/elements/Field';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import type { Translate } from '@/i18n/types';
import { cn } from '@/lib/utils';
import useFlash from '@/plugins/useFlash';

interface Values {
    email: string;
    username: string;
    name_first: string;
    name_last: string;
    password: string;
    password_confirmation: string;
}

const INITIAL: Values = {
    email: '',
    username: '',
    name_first: '',
    name_last: '',
    password: '',
    password_confirmation: '',
};

const STEP_LABELS = ['setup.steps.welcome', 'setup.steps.admin_account', 'setup.steps.review'] as const;

// Fields that must be valid before leaving each step. The welcome and review
// steps have nothing to validate — they advance unconditionally.
const STEP_FIELDS: Record<number, (keyof Values)[]> = {
    1: ['email', 'username', 'name_first', 'password', 'password_confirmation'],
};

// Mirrors the backend Username rule (lowercased before testing). The regex
// implies a minimum length of 3: a leading char, at least one middle char, and
// a trailing char — so the frontend enforces the same floor the backend does.
const USERNAME_RE = /^[a-z0-9]([\w.-]+)[a-z0-9]$/;

const createSchema = (t: Translate) =>
    object().shape({
        email: string().required(t('setup.email_required')).email(t('setup.email_invalid')).max(191),
        username: string()
            .required(t('setup.username_required'))
            .max(191)
            .test(
                'username-format',
                t('setup.username_format'),
                (v) => !v || (v.length >= 3 && USERNAME_RE.test(v.toLowerCase())),
            ),
        name_first: string().required(t('setup.first_name_required')).max(191),
        name_last: string().max(191).nullable(),
        password: string().required(t('setup.password_required')).min(8, t('setup.password_min')),
        password_confirmation: string()
            .required(t('setup.password_confirmation_required'))
            .test('password-match', t('setup.password_mismatch'), function (v) {
                // Let .required() own the empty case so only one message shows.
                if (!v) return true;
                return v === this.parent.password;
            }),
    });

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function scorePassword(pw: string): number {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(4, Math.max(0, score));
}

const STRENGTH = [
    { label: 'setup.password_strength.too_short', className: 'bg-[#d36666]' },
    { label: 'setup.password_strength.weak', className: 'bg-[#d36666]' },
    { label: 'setup.password_strength.fair', className: 'bg-mocha-50' },
    { label: 'setup.password_strength.good', className: 'bg-brand-400' },
    { label: 'setup.password_strength.strong', className: 'bg-brand-500' },
] as const;

const PasswordStrength = ({ value }: { value: string }) => {
    const { t } = useTranslation();

    if (!value) return null;
    const score = scorePassword(value);
    // scorePassword() always returns 0-4 and STRENGTH has one entry per value.
    const { label, className } = STRENGTH[score] ?? ({ label: '', className: '' } as const);

    return (
        <div className='flex items-center gap-3 mt-2.5'>
            <div className='flex gap-1 flex-1'>
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            'h-1 flex-1 rounded-full transition-colors duration-200',
                            i < score ? className : 'bg-white/8',
                        )}
                    />
                ))}
            </div>
            <span className='text-xs text-secondary tabular-nums w-14 text-right'>{label ? t(label) : ''}</span>
        </div>
    );
};

const StepTracker = ({ current }: { current: number }) => {
    const { t } = useTranslation();

    return (
        <div className='flex items-center gap-3'>
            {STEP_LABELS.map((label, i) => {
                const state = i < current ? 'done' : i === current ? 'active' : 'upcoming';
                return (
                    <div key={label} className='flex items-center gap-2'>
                        <div
                            className={cn(
                                'h-1.5 w-8 rounded-full transition-colors duration-200',
                                state === 'active' && 'bg-brand-500',
                                state === 'done' && 'bg-brand-500/40',
                                state === 'upcoming' && 'bg-white/8',
                            )}
                        />
                        <span
                            className={cn(
                                'text-xs transition-colors duration-200 hidden sm:inline',
                                state === 'active' ? 'text-cream-200' : 'text-secondary',
                            )}
                        >
                            {t(label)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
    <div className='flex items-center justify-between gap-4 py-2.5'>
        <dt className='text-sm text-secondary'>{label}</dt>
        <dd className='text-sm text-cream-200 text-right truncate'>{value || '—'}</dd>
    </div>
);

const SuccessPanel = ({ email }: { email: string }) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className='flex flex-col items-center text-center py-6 gap-4'
        >
            <svg
                width='44'
                height='44'
                viewBox='0 0 44 44'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                aria-label={t('setup.success.checkmark_label')}
                role='img'
            >
                <circle cx='22' cy='22' r='21' stroke='#fa4e49' strokeWidth='2' opacity='0.35' />
                <motion.path
                    d='M14 22.5L19.5 28L31 16'
                    stroke='#fa4e49'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
                />
            </svg>
            <div className='space-y-1.5'>
                <h2 className='text-2xl font-semibold text-cream-200'>{t('setup.success.title')}</h2>
                <p className='text-sm text-secondary'>{t('setup.success.signed_in', { email })}</p>
            </div>
            {/* Fallback in case the auto-redirect below is interrupted (e.g. the tab
                is refreshed during the brief delay). The session is already valid. */}
            <a
                href='/'
                className='text-sm text-secondary underline decoration-white/20 underline-offset-4 hover:text-cream-200 transition-colors'
            >
                {t('setup.success.open_dashboard')}
            </a>
        </motion.div>
    );
};

const SetupContainer = () => {
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const prefersReducedMotion = useReducedMotion();
    const [step, setStep] = useState(0);
    const [done, setDone] = useState(false);
    const { t, locale } = useTranslation();
    const schema = useMemo(() => createSchema(t), [t]);

    const stepMotion = {
        initial: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 },
        animate: prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
        exit: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 },
        transition: { duration: 0.24, ease: EASE },
    };

    const onSubmit = async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();
        // Final guard before the network: re-validate the full schema. If a field
        // went stale after the user stepped forward, send them back to fix it.
        try {
            await schema.validate(values, { abortEarly: false });
        } catch {
            setSubmitting(false);
            setStep(1);
            return;
        }

        try {
            const res = await setupAdmin({
                ...values,
                name_last: values.name_last || undefined,
                language: locale,
            });
            if (res.complete) {
                setDone(true);
                window.setTimeout(() => {
                    window.location.href = res.intended || '/';
                }, 800);
            } else {
                setSubmitting(false);
            }
        } catch (error) {
            clearAndAddHttpError({ error });
            setSubmitting(false);
        }
    };

    return (
        <Formik
            initialValues={INITIAL}
            validationSchema={schema}
            onSubmit={onSubmit}
            validateOnBlur
            validateOnChange={false}
        >
            {({ values, validateForm, setTouched, isSubmitting, handleSubmit }) => {
                // validateForm() runs the full schema and is what populates the
                // Formik `errors` the touched <Field>s render against — keep it.
                const advance = async () => {
                    const all = await validateForm(values);
                    const fields = STEP_FIELDS[step] ?? [];
                    if (fields.length) {
                        const touch = {} as { [K in keyof Values]?: boolean };
                        let blocked = false;
                        for (const f of fields) {
                            touch[f] = true;
                            if (all[f]) blocked = true;
                        }
                        setTouched(touch);
                        if (blocked) return;
                    }
                    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
                };

                const back = () => setStep((s) => Math.max(0, s - 1));

                // Light up the primary CTA once the current step is ready to proceed.
                const _ready = step === 0 ? true : schema.isValidSync(values);

                return (
                    <Form className='w-full max-w-md mx-auto flex flex-col gap-8'>
                        <FlashMessageRender />

                        {!done && <StepTracker current={step} />}

                        <AnimatePresence mode='wait' initial={false}>
                            {done ? (
                                <motion.div key='done' {...stepMotion}>
                                    <SuccessPanel email={values.email} />
                                </motion.div>
                            ) : step === 0 ? (
                                <motion.div key='welcome' {...stepMotion} className='space-y-5'>
                                    <div className='space-y-3'>
                                        <h2 className='text-3xl font-semibold text-cream-200 tracking-tight'>
                                            {t('setup.welcome.title')}
                                        </h2>
                                        <p className='text-sm text-secondary leading-relaxed'>
                                            {t('setup.welcome.description')}
                                        </p>
                                    </div>
                                    <p className='text-xs text-secondary leading-relaxed border-t border-white/10 pt-4'>
                                        {t('setup.welcome.notice')}
                                    </p>
                                </motion.div>
                            ) : step === 1 ? (
                                <motion.div key='account' {...stepMotion} className='space-y-5'>
                                    <div className='space-y-1'>
                                        <h2 className='text-2xl font-semibold text-cream-200 tracking-tight'>
                                            {t('setup.account.title')}
                                        </h2>
                                        <p className='text-sm text-secondary'>{t('setup.account.description')}</p>
                                    </div>
                                    <Field
                                        id='email'
                                        name='email'
                                        type='email'
                                        label={t('setup.account.email_label')}
                                        disabled={isSubmitting}
                                    />
                                    <Field
                                        id='username'
                                        name='username'
                                        type='text'
                                        label={t('setup.account.username_label')}
                                        disabled={isSubmitting}
                                    />
                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                        <Field
                                            id='name_first'
                                            name='name_first'
                                            type='text'
                                            label={t('setup.account.first_name_label')}
                                            disabled={isSubmitting}
                                        />
                                        <Field
                                            id='name_last'
                                            name='name_last'
                                            type='text'
                                            label={t('setup.account.last_name_label')}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div>
                                        <Field
                                            id='password'
                                            name='password'
                                            type='password'
                                            label={t('setup.account.password_label')}
                                            disabled={isSubmitting}
                                        />
                                        <PasswordStrength value={values.password} />
                                    </div>
                                    <Field
                                        id='password_confirmation'
                                        name='password_confirmation'
                                        type='password'
                                        label={t('setup.account.confirm_password_label')}
                                        disabled={isSubmitting}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div key='review' {...stepMotion} className='space-y-5'>
                                    <div className='space-y-1'>
                                        <h2 className='text-2xl font-semibold text-cream-200 tracking-tight'>
                                            {t('setup.review.title')}
                                        </h2>
                                        <p className='text-sm text-secondary'>{t('setup.review.description')}</p>
                                    </div>
                                    <dl className='divide-y divide-white/10'>
                                        <ReviewRow label={t('setup.review.email_label')} value={values.email} />
                                        <ReviewRow label={t('setup.review.username_label')} value={values.username} />
                                        <ReviewRow
                                            label={t('setup.review.name_label')}
                                            value={[values.name_first, values.name_last].filter(Boolean).join(' ')}
                                        />
                                        <ReviewRow
                                            label={t('setup.review.role_label')}
                                            value={t('setup.review.role_value')}
                                        />
                                    </dl>
                                    <p className='text-xs text-secondary leading-relaxed'>{t('setup.review.notice')}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!done && (
                            <div className='flex items-center justify-between gap-3'>
                                {step > 0 ? (
                                    <Button
                                        type='button'
                                        variant='secondary'
                                        onClick={back}
                                        disabled={isSubmitting}
                                        className='text-secondary hover:text-cream-200 rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-40'
                                    >
                                        {t('common.back')}
                                    </Button>
                                ) : (
                                    <span />
                                )}
                                {step < STEP_LABELS.length - 1 ? (
                                    <Button
                                        key='advance'
                                        type='button'
                                        variant='attention'
                                        onClick={advance}
                                        disabled={isSubmitting}
                                    >
                                        {step === 0 ? t('setup.actions.get_started') : t('setup.actions.continue')}
                                    </Button>
                                ) : (
                                    <Button
                                        key='submit'
                                        type='button'
                                        variant='attention'
                                        onClick={handleSubmit}
                                        isLoading={isSubmitting}
                                        disabled={isSubmitting}
                                    >
                                        {t('setup.actions.create_admin')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </Form>
                );
            }}
        </Formik>
    );
};

export default SetupContainer;
