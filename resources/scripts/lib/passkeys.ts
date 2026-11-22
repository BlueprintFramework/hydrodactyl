import type { Translate, TranslationKey } from '@/i18n/types';

const ERROR_KEYS: Record<string, TranslationKey> = {
    UserCancelledError: 'passkeys.errors.cancelled',
    AbortError: 'passkeys.errors.cancelled',
    NotAllowedError: 'passkeys.errors.cancelled',
    NotSupportedError: 'passkeys.errors.not_supported',
    PasskeyExistsError: 'passkeys.errors.exists',
    InvalidStateError: 'passkeys.errors.exists',
    InvalidDomainError: 'passkeys.errors.invalid_domain',
    UnexpectedResponseError: 'passkeys.errors.unexpected_response',
    SecurityError: 'passkeys.errors.security',
    TimeoutError: 'passkeys.errors.timeout',
    ConstraintError: 'passkeys.errors.constraint',
    NotReadableError: 'passkeys.errors.unavailable',
};

const MESSAGE_KEYS: Record<string, TranslationKey> = {
    'The passkey operation was cancelled.': 'passkeys.errors.cancelled',
    'Passkeys are not supported in this browser.': 'passkeys.errors.not_supported',
    'This device is already registered as a passkey.': 'passkeys.errors.exists',
    'An unknown error occurred.': 'passkeys.errors.unknown',
    'Passkey not recognized. It may have been removed from your account.': 'passkeys.errors.not_recognized',
    'Unable to verify passkey. Please try again.': 'passkeys.errors.verify_failed',
    'Unable to register passkey. Please try again.': 'passkeys.errors.register_failed',
    'Unable to register this passkey.': 'passkeys.errors.register_failed',
    'Invalid credential format.': 'passkeys.errors.invalid_credential',
    'Passkey verification session expired. Please try again.': 'passkeys.errors.verification_expired',
    'Passkey registration session expired. Please try again.': 'passkeys.errors.registration_expired',
    'Unable to sign in with this account.': 'passkeys.errors.sign_in_failed',
};

export const isPasswordConfirmationError = (error: unknown): boolean => {
    if (typeof error !== 'object' || error === null) {
        return false;
    }

    const status =
        (error as { status?: unknown }).status ?? (error as { response?: { status?: unknown } }).response?.status;

    return status === 423;
};

export const passkeyErrorMessage = (error: unknown, t: Translate): string => {
    if (!(error instanceof Error)) {
        return t('passkeys.errors.unknown');
    }

    const key = ERROR_KEYS[error.name] ?? MESSAGE_KEYS[error.message];

    if (key) {
        return t(key);
    }

    return error.message || t('passkeys.errors.unknown');
};
