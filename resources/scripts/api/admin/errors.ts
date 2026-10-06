import type { AxiosError } from 'axios';
import { httpErrorToHuman } from '@/api/http';

interface ApiError {
    detail?: string;
    meta?: { source_field?: string };
    source?: { pointer?: string };
}

/**
 * Pull per-field validation messages out of a Pterodactyl error response so
 * they can be shown inline on the form.
 */
export const parseValidationErrors = (error: unknown): Record<string, string> => {
    const data = (error as AxiosError<{ errors?: unknown }>).response?.data;
    const errors = data?.errors;

    if (Array.isArray(errors)) {
        return (errors as ApiError[]).reduce<Record<string, string>>((carry, item) => {
            const field = item?.meta?.source_field ?? item?.source?.pointer?.split('/').pop();
            if (field && item?.detail) {
                carry[field] = item.detail;
            }

            return carry;
        }, {});
    }

    if (errors && typeof errors === 'object') {
        return Object.entries(errors as Record<string, string[] | string>).reduce<Record<string, string>>(
            (carry, [field, value]) => {
                carry[field] = Array.isArray(value) ? (value[0] ?? '') : value;
                return carry;
            },
            {},
        );
    }

    return {};
};

export const errorToMessage = (error: unknown, fallback: string): string =>
    httpErrorToHuman(error as { message?: string }) || fallback;
