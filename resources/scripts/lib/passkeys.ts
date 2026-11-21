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
