import { Formik, Form, type FormikHelpers } from 'formik';
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { object, string } from 'yup';

import setupAdmin from '@/api/auth/setup';
import { Button } from '@/components/ui/button';
import Field from '@/components/elements/Field';
import FlashMessageRender from '@/components/FlashMessageRender';
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

const STEP_LABELS = ['Welcome', 'Admin account', 'Review'] as const;

// Fields that must be valid before leaving each step. The welcome and review
// steps have nothing to validate — they advance unconditionally.
const STEP_FIELDS: Record<number, (keyof Values)[]> = {
    1: ['email', 'username', 'name_first', 'password', 'password_confirmation'],
};

// Mirrors the backend Username rule (lowercased before testing). The regex
// implies a minimum length of 3: a leading char, at least one middle char, and
// a trailing char — so the frontend enforces the same floor the backend does.
const USERNAME_RE = /^[a-z0-9]([\w.-]+)[a-z0-9]$/;

const schema = object().shape({
    email: string().required('An email is required.').email('Enter a valid email address.').max(191),
    username: string()
        .required('A username is required.')
        .max(191)
        .test(
            'username-format',
            'Use 3-191 characters, starting and ending with a letter or number. Only letters, numbers, dots, dashes, and underscores are allowed.',
            (v) => !v || (v.length >= 3 && USERNAME_RE.test(v.toLowerCase())),
        ),
    name_first: string().required('A first name is required.').max(191),
    name_last: string().max(191).nullable(),
    password: string().required('A password is required.').min(8, 'Use at least 8 characters.'),
    password_confirmation: string()
        .required('Please confirm your password.')
        .test('password-match', 'Passwords do not match.', function(v) {
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
    { label: 'Too short', className: 'bg-[#d36666]' },
    { label: 'Weak', className: 'bg-[#d36666]' },
    { label: 'Fair', className: 'bg-mocha-50' },
    { label: 'Good', className: 'bg-brand-400' },
    { label: 'Strong', className: 'bg-brand-500' },
];

const PasswordStrength = ({ value }: { value: string }) => {
    if (!value) return null;
    const score = scorePassword(value);
    // scorePassword() always returns 0-4 and STRENGTH has one entry per value.
    const { label, className } = STRENGTH[score]!;

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
            <span className='text-xs text-secondary tabular-nums w-14 text-right'>{label}</span>
        </div>
    );
};

const StepTracker = ({ current }: { current: number }) => (
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
                        {label}
                    </span>
                </div>
            );
        })}
    </div>
);

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
    <div className='flex items-center justify-between gap-4 py-2.5'>
        <dt className='text-sm text-secondary'>{label}</dt>
        <dd className='text-sm text-cream-200 text-right truncate'>{value || '—'}</dd>
    </div>
);

const SuccessPanel = ({ email }: { email: string }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className='flex flex-col items-center text-center py-6 gap-4'
    >
        <svg width='44' height='44' viewBox='0 0 44 44' fill='none' xmlns='http://www.w3.org/2000/svg'>
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
            <h2 className='text-2xl font-semibold text-cream-200'>You&apos;re all set</h2>
            <p className='text-sm text-secondary'>Signed in as {email}. Taking you to your dashboard…</p>
        </div>
        {/* Fallback in case the auto-redirect below is interrupted (e.g. the tab
            is refreshed during the brief delay). The session is already valid. */}
        <a
            href='/'
            className='text-sm text-secondary underline decoration-white/20 underline-offset-4 hover:text-cream-200 transition-colors'
        >
            Open dashboard
        </a>
    </motion.div>
);

const SetupContainer = () => {
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const prefersReducedMotion = useReducedMotion();
    const [step, setStep] = useState(0);
    const [done, setDone] = useState(false);

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
        <Formik initialValues={INITIAL} validationSchema={schema} onSubmit={onSubmit} validateOnBlur validateOnChange={false}>
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
                const ready = step === 0 ? true : schema.isValidSync(values);

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
                                            Welcome.
                                        </h2>
                                        <p className='text-sm text-secondary leading-relaxed'>
                                            This is a fresh Hydrodactyl installation — no administrator account exists
                                            yet. We&apos;ll create your first account, grant it full panel access, and
                                            sign you right in. It only takes a moment.
                                        </p>
                                    </div>
                                    <p className='text-xs text-secondary leading-relaxed border-t border-white/10 pt-4'>
                                        You won&apos;t see this again. Once an account exists, this setup screen
                                        disappears entirely.
                                    </p>
                                </motion.div>
                            ) : step === 1 ? (
                                <motion.div key='account' {...stepMotion} className='space-y-5'>
                                    <div className='space-y-1'>
                                        <h2 className='text-2xl font-semibold text-cream-200 tracking-tight'>
                                            Create your account
                                        </h2>
                                        <p className='text-sm text-secondary'>
                                            These are your administrator credentials.
                                        </p>
                                    </div>
                                    <Field id='email' name='email' type='email' label='Email' disabled={isSubmitting} />
                                    <Field id='username' name='username' type='text' label='Username' disabled={isSubmitting} />
                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                        <Field id='name_first' name='name_first' type='text' label='First name' disabled={isSubmitting} />
                                        <Field id='name_last' name='name_last' type='text' label='Last name' disabled={isSubmitting} />
                                    </div>
                                    <div>
                                        <Field id='password' name='password' type='password' label='Password' disabled={isSubmitting} />
                                        <PasswordStrength value={values.password} />
                                    </div>
                                    <Field
                                        id='password_confirmation'
                                        name='password_confirmation'
                                        type='password'
                                        label='Confirm password'
                                        disabled={isSubmitting}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div key='review' {...stepMotion} className='space-y-5'>
                                    <div className='space-y-1'>
                                        <h2 className='text-2xl font-semibold text-cream-200 tracking-tight'>
                                            Review &amp; create
                                        </h2>
                                        <p className='text-sm text-secondary'>Make sure everything looks right.</p>
                                    </div>
                                    <dl className='divide-y divide-white/10'>
                                        <ReviewRow label='Email' value={values.email} />
                                        <ReviewRow label='Username' value={values.username} />
                                        <ReviewRow
                                            label='Name'
                                            value={[values.name_first, values.name_last].filter(Boolean).join(' ')}
                                        />
                                        <ReviewRow label='Role' value='Administrator' />
                                    </dl>
                                    <p className='text-xs text-secondary leading-relaxed'>
                                        This account will be created with full administrator privileges, then
                                        you&apos;ll be signed in immediately.
                                    </p>
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
                                        Back
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
                                        {step === 0 ? 'Get started' : 'Continue'}
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
                                        Create admin account
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
