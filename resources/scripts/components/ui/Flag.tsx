import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FlagProps {
    /** Locale code ("en-US") or short identifier ("en-us") used to resolve the flag. */
    identifier: string;
    /** Accessible description; the flag is decorative when omitted. */
    label?: string;
    className?: string;
}

/**
 * Resolve the ISO 3166-1 alpha-2 country from a locale or short identifier.
 * "pt-BR" and "pt-br" both resolve to "br"; codes without a region ("es")
 * fall back to the language itself.
 */
function countryCode(identifier: string): string | undefined {
    const normalized = identifier.trim().toLowerCase();

    if (normalized.length === 0) {
        return undefined;
    }

    const [, region] = normalized.split('-');
    const candidate = region && region.length === 2 ? region : normalized.slice(0, 2);

    return /^[a-z]{2}$/.test(candidate) ? candidate : undefined;
}

/**
 * Language flag loaded from the FlagCDN API. Renders nothing for identifiers
 * without a resolvable country or when the image fails to load.
 */
export default function Flag({ identifier, label, className }: FlagProps) {
    const [failed, setFailed] = useState(false);
    const country = countryCode(identifier);

    if (!country || failed) {
        return null;
    }

    return (
        <img
            src={`https://flagcdn.com/w40/${country}.png`}
            srcSet={`https://flagcdn.com/w40/${country}.png 1x, https://flagcdn.com/w80/${country}.png 2x`}
            width={20}
            height={15}
            alt={label ?? ''}
            aria-hidden={label ? undefined : true}
            loading='lazy'
            decoding='async'
            referrerPolicy='no-referrer'
            onError={() => setFailed(true)}
            className={cn(
                'inline-block h-[15px] w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-black/10',
                className,
            )}
        />
    );
}
